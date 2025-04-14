/* eslint-disable @typescript-eslint/no-throw-literal */
import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import {
  zNativeTokenStreamPermission,
  type Permission,
} from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError, UserInputEventType } from '@metamask/snaps-sdk';
import type { JsonObject } from '@metamask/snaps-sdk/jsx';
import { maxUint256, toHex, type Hex } from 'viem';

import type { PermissionConfirmationContext } from '../../ui';
import {
  RulesSelectorElementNames,
  NativeTokenStreamDialogElementNames,
  TIME_PERIOD_TO_SECONDS,
  TimePeriod,
  handleFormSubmit,
  handleRemoveRuleClicked,
  handleReplaceTextInput,
  handleReplaceValueInput,
  handleToggleBooleanClicked,
} from '../../ui';
import { NativeTokenStreamConfirmationPage } from '../../ui/confirmations';
import type { UserEventHandler } from '../../userEventDispatcher';
import {
  convertReadableDateToTimestamp,
  convertTimestampToReadableDate,
  formatTokenBalance,
  maxAllowanceParser,
  zeroDefaultParser,
} from '../../utils';
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
      [RulesSelectorElementNames.AddMoreRulesPageToggle]: boolean;
      [NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded]: boolean;
      [NativeTokenStreamDialogElementNames.StreamAmountInput]: Hex;
      [NativeTokenStreamDialogElementNames.PeriodInput]: TimePeriod;
      rules: {
        [NativeTokenStreamDialogElementNames.MaxAllowanceRule]: string | null;
        [NativeTokenStreamDialogElementNames.InitialAmountRule]: string | null;
        [NativeTokenStreamDialogElementNames.StartTimeRule]: string | null;
        [NativeTokenStreamDialogElementNames.ExpiryRule]: string | null;
      };
      [NativeTokenStreamDialogElementNames.SelectedRuleDropdown]: string;
      [NativeTokenStreamDialogElementNames.SelectedRuleInput]: string;
      [NativeTokenStreamDialogElementNames.MaxAllowanceDropdown]: string;
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
          isAdjustmentAllowed={context.isAdjustmentAllowed}
        />
      );
    },
    appendPermissionCaveats: async (
      permissionContextMeta: PermissionContextMeta<'native-token-stream'>,
    ) => {
      const { attenuatedPermission, caveatBuilder } = permissionContextMeta;

      const { initialAmount, maxAmount, amountPerSecond, startTime } =
        attenuatedPermission.data;

      const intialAmountBigInt =
        initialAmount === undefined ? 0n : BigInt(initialAmount);

      caveatBuilder
        .addCaveat(
          'nativeTokenStreaming',
          intialAmountBigInt,
          BigInt(maxAmount),
          BigInt(amountPerSecond),
          startTime,
        )
        // don't allow any calldata as this could be used to extract additional authority
        // not included in a native token stream permission
        .addCaveat('exactCalldata', '0x');

      return caveatBuilder;
    },
    resolveAttenuatedPermission: async (
      requestedPermission: PermissionTypeMapping['native-token-stream'],
      attenuatedContext: PermissionConfirmationContext<'native-token-stream'>,
    ) => {
      const {
        state,
        expiry: requestedExpiry,
        isAdjustmentAllowed,
      } = attenuatedContext;

      let attenuatedPermission: PermissionTypeMapping['native-token-stream'];

      if (!isAdjustmentAllowed) {
        // no adjustment allowed, just need to add defaults to requested values
        // todo: do we even need to add defaults here?
        attenuatedPermission = {
          type: 'native-token-stream',
          data: {
            ...requestedPermission.data,
            initialAmount: requestedPermission.data.initialAmount || '0x0',
          },
          expiry: requestedExpiry,
        };
      } else {
        // If adjustment is allowed, we need to capture the user's adjusted values
        const attenuatedStreamAmount =
          state[NativeTokenStreamDialogElementNames.StreamAmountInput];
        const period = state[NativeTokenStreamDialogElementNames.PeriodInput];
        const attenuatedAmountPerSecond = toHex(
          BigInt(attenuatedStreamAmount) /
            BigInt(TIME_PERIOD_TO_SECONDS[period]),
        );
        const attenuatedExpiry =
          state.rules[NativeTokenStreamDialogElementNames.ExpiryRule];
        const attenuatedInitialAmount =
          state.rules[NativeTokenStreamDialogElementNames.InitialAmountRule];
        const attenuatedStartTime =
          state.rules[NativeTokenStreamDialogElementNames.StartTimeRule];
        const attenuatedMaxAllowance =
          state.rules[NativeTokenStreamDialogElementNames.MaxAllowanceRule];

        attenuatedPermission = {
          type: 'native-token-stream',
          data: {
            maxAmount: maxAllowanceParser(
              attenuatedMaxAllowance || 'Unlimited',
            ),
            amountPerSecond: attenuatedAmountPerSecond,
            initialAmount: zeroDefaultParser(attenuatedInitialAmount),
            startTime: attenuatedStartTime
              ? convertReadableDateToTimestamp(attenuatedStartTime)
              : requestedPermission.data.startTime,
            justification: requestedPermission.data.justification,
          },
          expiry: attenuatedExpiry
            ? convertReadableDateToTimestamp(attenuatedExpiry)
            : requestedExpiry,
        };
      }

      return {
        attenuatedPermission,
        expiry: requestedExpiry,
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
      const streamAmount =
        BigInt(permission.data.amountPerSecond) *
        TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY];

      return {
        state: {
          [NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded]:
            true,
          [NativeTokenStreamDialogElementNames.StreamAmountInput]:
            toHex(streamAmount),
          [NativeTokenStreamDialogElementNames.PeriodInput]: TimePeriod.WEEKLY,

          // Rules are in human readable format is state so UI components do not need to convert them
          rules: {
            [NativeTokenStreamDialogElementNames.MaxAllowanceRule]: 'Unlimited',
            [NativeTokenStreamDialogElementNames.InitialAmountRule]: permission
              .data.initialAmount
              ? formatTokenBalance(permission.data.initialAmount)
              : null,
            [NativeTokenStreamDialogElementNames.StartTimeRule]:
              convertTimestampToReadableDate(permission.data.startTime),
            [NativeTokenStreamDialogElementNames.ExpiryRule]:
              convertTimestampToReadableDate(expiry),
          },
          [RulesSelectorElementNames.AddMoreRulesPageToggle]: false,
          [NativeTokenStreamDialogElementNames.SelectedRuleDropdown]: '',
          [NativeTokenStreamDialogElementNames.SelectedRuleInput]: '',
          [NativeTokenStreamDialogElementNames.MaxAllowanceDropdown]: '',
        },

        dialogContentEventHandlers: [
          // shared component handlers
          {
            elementName:
              NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded,
            eventType: UserInputEventType.ButtonClickEvent,
            handler:
              handleToggleBooleanClicked as UserEventHandler<UserInputEventType>,
          },

          // Stream amount input handler
          {
            elementName: NativeTokenStreamDialogElementNames.StreamAmountInput,
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

          // Adding Rules form handlers
          {
            elementName: RulesSelectorElementNames.AddMoreRulesPageToggle,
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
          {
            elementName:
              NativeTokenStreamDialogElementNames.MaxAllowanceDropdown,
            eventType: UserInputEventType.InputChangeEvent,
            handler:
              handleReplaceTextInput as UserEventHandler<UserInputEventType>,
          },

          // Remove Rules handlers
          {
            elementName: NativeTokenStreamDialogElementNames.MaxAllowanceRule,
            eventType: UserInputEventType.ButtonClickEvent,
            handler:
              handleRemoveRuleClicked as UserEventHandler<UserInputEventType>,
          },
          {
            elementName: NativeTokenStreamDialogElementNames.InitialAmountRule,
            eventType: UserInputEventType.ButtonClickEvent,
            handler:
              handleRemoveRuleClicked as UserEventHandler<UserInputEventType>,
          },
          {
            elementName: NativeTokenStreamDialogElementNames.StartTimeRule,
            eventType: UserInputEventType.ButtonClickEvent,
            handler:
              handleRemoveRuleClicked as UserEventHandler<UserInputEventType>,
          },
          {
            elementName: NativeTokenStreamDialogElementNames.ExpiryRule,
            eventType: UserInputEventType.ButtonClickEvent,
            handler:
              handleRemoveRuleClicked as UserEventHandler<UserInputEventType>,
          },
        ],
      };
    },
  };
};
