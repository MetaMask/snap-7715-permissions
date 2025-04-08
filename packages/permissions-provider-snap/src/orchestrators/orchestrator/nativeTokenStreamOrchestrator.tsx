/* eslint-disable @typescript-eslint/no-throw-literal */
import type { CoreCaveatBuilder } from '@metamask-private/delegator-core-viem';
import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import {
  zNativeTokenStreamPermission,
  type Permission,
} from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError, UserInputEventType } from '@metamask/snaps-sdk';
import type { JsonObject } from '@metamask/snaps-sdk/jsx';
import { toHex, type Hex } from 'viem';

import type { PermissionConfirmationContext } from '../../ui';
import {
  NativeTokenStreamDialogElementNames,
  TIME_PERIOD_MAPPING,
  TimePeriod,
  handleFormSubmit,
  handleReplaceTextInput,
  handleReplaceValueInput,
  handleToggleBooleanClicked,
} from '../../ui';
import { NativeTokenStreamConfirmationPage } from '../../ui/confirmations';
import type { UserEventHandler } from '../../userEventDispatcher';
import type {
  OrchestratorFactoryFunction,
  PermissionContextMeta,
} from '../types';
import type { PermissionTypeMapping } from './types';

declare module './types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-shadow
  interface PermissionTypeMapping {
    'native-token-stream': JsonObject & NativeTokenStreamPermission; // JsonObject & NativeTokenStreamPermission to be compatible with the Snap JSON object type
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-shadow
  interface PermissionConfirmationStateMapping {
    'native-token-stream': JsonObject & {
      [NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded]: boolean;
      [NativeTokenStreamDialogElementNames.MaxAmountInput]: Hex;
      [NativeTokenStreamDialogElementNames.PeriodInput]: TimePeriod;

      // Add Rules
      [NativeTokenStreamDialogElementNames.AddMoreRulesToggle]: boolean;
      [NativeTokenStreamDialogElementNames.SelectedRuleDropdown]: string;
      [NativeTokenStreamDialogElementNames.SelectedRuleInput]: string;

      [NativeTokenStreamDialogElementNames.MaxAllowanceRule]:
        | Hex
        | 'Unlimited'
        | null;
      [NativeTokenStreamDialogElementNames.InitialAmountRule]: Hex | null;
      [NativeTokenStreamDialogElementNames.StartTimeRule]: number | null;
      [NativeTokenStreamDialogElementNames.ExpiryRule]: number | null;
    };
  }
}

/**
 * Parses a permission request and returns the permission object.
 *
 * @param basePermission - The base permission object.
 * @returns The permission object.
 * @throws An error if the permission in the request is invalid.
 * @throws An error if the permission type is not supported.
 */
const parsePermission = (
  basePermission: Permission,
): NativeTokenStreamPermission => {
  const validateRes = zNativeTokenStreamPermission.safeParse(basePermission);
  if (!validateRes.success) {
    throw new InvalidParamsError(extractZodError(validateRes.error.errors));
  }

  return validateRes.data;
};

/**
 * Validates a permission object data specific to the permission type.
 *
 * @param permission - The permission object.
 * @returns True if the permission object data is valid.
 * @throws Error if the initial amount is not greater than 0.
 * @throws Error if the max amount is not greater than 0.
 * @throws Error if the max amount is less than the initial amount.
 * @throws Error if the amount per second is not a positive number.
 * @throws Error if the start time is not a positive number.
 */
const validatePermissionData = (
  permission: NativeTokenStreamPermission,
): true => {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;
  const bigIntAmountPerSecond = BigInt(amountPerSecond);
  const bigIntMaxAmount = BigInt(maxAmount);

  if (bigIntMaxAmount <= 0n) {
    throw new InvalidParamsError(
      'Invalid maxAmount: must be a positive number',
    );
  }

  if (initialAmount) {
    const bigIntInitialAmount = BigInt(initialAmount);
    if (bigIntInitialAmount <= 0n) {
      throw new InvalidParamsError(
        'Invalid initialAmount: must be greater than zero',
      );
    }

    if (bigIntMaxAmount < bigIntInitialAmount) {
      throw new InvalidParamsError(
        'Invalid maxAmount: must be greater than initialAmount',
      );
    }
  }

  if (bigIntAmountPerSecond <= 0n) {
    throw new InvalidParamsError(
      'Invalid amountPerSecond: must be a positive number',
    );
  }

  if (startTime <= 0) {
    throw new InvalidParamsError(
      'Invalid startTime: must be a positive number',
    );
  }

  if (startTime !== Math.floor(startTime)) {
    throw new InvalidParamsError('Invalid startTime: must be an integer');
  }

  return true;
};

/**
 * Factory function to create a permission orchestrator for a native-token-stream permission type.
 *
 * @returns A permission orchestrator for the native-token-stream permission type.
 */
export const nativeTokenStreamPermissionOrchestrator: OrchestratorFactoryFunction<
  'native-token-stream'
> = () => {
  return {
    parseAndValidate: async (basePermission: Permission) => {
      const validatedPermission = parsePermission(basePermission);
      validatePermissionData(validatedPermission);

      return validatedPermission as PermissionTypeMapping['native-token-stream'];
    },
    buildPermissionConfirmation: (
      context: PermissionConfirmationContext<'native-token-stream'>,
    ) => {
      return (
        <NativeTokenStreamConfirmationPage
          siteOrigin={context.siteOrigin}
          address={context.address}
          justification={context.justification}
          balance={context.balance}
          expiry={context.expiry}
          chainId={context.chainId}
          valueFormattedAsCurrency={context.valueFormattedAsCurrency}
          state={context.state}
        />
      );
    },
    appendPermissionCaveats: async (
      permissionContextMeta: PermissionContextMeta<'native-token-stream'>,
    ) => {
      const { attenuatedPermission, caveatBuilder } = permissionContextMeta;
      // TODO: Using native token allowance enforcers, for now, until native token stream enforcer is available in delegator-sdk
      const updatedCaveatBuilder: CoreCaveatBuilder = caveatBuilder.addCaveat(
        'nativeTokenTransferAmount',
        BigInt(attenuatedPermission.data.initialAmount ?? 0),
      );

      return updatedCaveatBuilder;
    },
    resolveAttenuatedPermission: async (
      requestedPermission: PermissionTypeMapping['native-token-stream'],
      attenuatedContext: PermissionConfirmationContext<'native-token-stream'>,
    ) => {
      const { state, expiry: requestedExpiry } = attenuatedContext;

      const maxAmount =
        state[NativeTokenStreamDialogElementNames.MaxAmountInput];
      const period = state[NativeTokenStreamDialogElementNames.PeriodInput];
      const amountPerSecond = toHex(
        BigInt(maxAmount) / BigInt(TIME_PERIOD_MAPPING[period]),
      );

      return {
        expiry: requestedExpiry,
        attenuatedPermission: {
          ...requestedPermission,
          data: {
            ...requestedPermission.data,
            maxAmount,
            amountPerSecond,
          },
        } as PermissionTypeMapping['native-token-stream'],
      };
    },
    getTokenCaipAssetType(
      _: PermissionTypeMapping['native-token-stream'],
      _chainId: number,
    ) {
      // TODO: Use the chainId to determine the native asset type since native token is not always ETH on all chains
      return `eip155:1/slip44:60`;
    },
    getConfirmationDialogEventHandlers: (
      permission: PermissionTypeMapping['native-token-stream'],
      expiry: number,
    ) => {
      return {
        state: {
          [NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded]:
            true,
          [NativeTokenStreamDialogElementNames.MaxAmountInput]:
            permission.data.maxAmount,
          [NativeTokenStreamDialogElementNames.PeriodInput]: TimePeriod.WEEKLY,

          // Adding Rules
          [NativeTokenStreamDialogElementNames.AddMoreRulesToggle]: false,
          [NativeTokenStreamDialogElementNames.SelectedRuleDropdown]: '',
          [NativeTokenStreamDialogElementNames.SelectedRuleInput]: '',

          // Rules values
          [NativeTokenStreamDialogElementNames.MaxAllowanceRule]: 'Unlimited',
          [NativeTokenStreamDialogElementNames.InitialAmountRule]:
            permission.data.initialAmount ?? null,
          [NativeTokenStreamDialogElementNames.StartTimeRule]: null,
          [NativeTokenStreamDialogElementNames.ExpiryRule]: expiry,
        },

        dialogContentEventHandlers: [
          {
            elementName:
              NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded,
            eventType: UserInputEventType.ButtonClickEvent,
            handler:
              handleToggleBooleanClicked as UserEventHandler<UserInputEventType>,
          },
          {
            elementName: NativeTokenStreamDialogElementNames.MaxAmountInput,
            eventType: UserInputEventType.InputChangeEvent,
            handler:
              handleReplaceValueInput as UserEventHandler<UserInputEventType>,
          },
          {
            elementName: NativeTokenStreamDialogElementNames.PeriodInput,
            eventType: UserInputEventType.InputChangeEvent,
            handler:
              handleReplaceTextInput as UserEventHandler<UserInputEventType>,
          },

          // Adding Rules
          {
            elementName: NativeTokenStreamDialogElementNames.AddMoreRulesToggle,
            eventType: UserInputEventType.ButtonClickEvent,
            handler:
              handleToggleBooleanClicked as UserEventHandler<UserInputEventType>,
          },
          {
            elementName:
              NativeTokenStreamDialogElementNames.AddMoreRulesFormSubmit,
            eventType: UserInputEventType.FormSubmitEvent,
            handler: handleFormSubmit as UserEventHandler<UserInputEventType>,
          },
          {
            elementName:
              NativeTokenStreamDialogElementNames.SelectedRuleDropdown,
            eventType: UserInputEventType.InputChangeEvent,
            handler:
              handleReplaceTextInput as UserEventHandler<UserInputEventType>,
          },
          {
            elementName: NativeTokenStreamDialogElementNames.SelectedRuleInput,
            eventType: UserInputEventType.InputChangeEvent,
            handler:
              handleReplaceTextInput as UserEventHandler<UserInputEventType>,
          },

          // Remove Rules
          {
            elementName: NativeTokenStreamDialogElementNames.MaxAllowanceRule,
            eventType: UserInputEventType.InputChangeEvent,
            handler:
              handleReplaceValueInput as UserEventHandler<UserInputEventType>,
          },
          {
            elementName: NativeTokenStreamDialogElementNames.InitialAmountRule,
            eventType: UserInputEventType.InputChangeEvent,
            handler:
              handleReplaceValueInput as UserEventHandler<UserInputEventType>,
          },
          {
            elementName: NativeTokenStreamDialogElementNames.StartTimeRule,
            eventType: UserInputEventType.InputChangeEvent,
            handler:
              handleReplaceTextInput as UserEventHandler<UserInputEventType>,
          },
          {
            elementName: NativeTokenStreamDialogElementNames.ExpiryRule,
            eventType: UserInputEventType.InputChangeEvent,
            handler:
              handleReplaceTextInput as UserEventHandler<UserInputEventType>,
          },
        ],
      };
    },
  };
};
