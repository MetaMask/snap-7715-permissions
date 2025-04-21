import { type Permission } from '@metamask/7715-permissions-shared/types';
import { UserInputEventType } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';
import { maxUint256, toHex, extractChain } from 'viem';
import * as ALL_CHAINS from 'viem/chains';

import type { PermissionConfirmationContext } from '../../confirmation';
import {
  ICONS,
  RulesSelectorElementNames,
  TIME_PERIOD_TO_SECONDS,
  TimePeriod,
  handleFormSubmit,
  handleRemoveRuleClicked,
  handleReplaceTextInput,
  handleReplaceValueInput,
  handleToggleBooleanClicked,
} from '../../confirmation';
import type { UserEventHandler, UserInputEventByType } from '../../core';
import {
  convertReadableDateToTimestamp,
  convertTimestampToReadableDate,
  formatTokenBalance,
  getStartOfNextDayUTC,
  getStartOfTodayUTC,
  maxAllowanceParser,
  zeroDefaultParser,
} from '../../utils';
import { BaseOrchestrator } from '../baseOrchestrator';
import type {
  PermissionContextMeta,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../types';
import { NativeTokenStreamConfirmationPage } from './confirmation/content';
import { NativeTokenStreamDialogElementNames } from './types';
import { parsePermission, validatePermissionData } from './validation';

/**
 * Orchestrator for a native-token-stream permission type.
 *
 * @returns A permission orchestrator for the native-token-stream permission type.
 */
export class NativeTokenStreamOrchestrator extends BaseOrchestrator<'native-token-stream'> {
  readonly #elementNameMapping = [
    // shared component handlers
    {
      elementName:
        NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded,
      eventType: UserInputEventType.ButtonClickEvent,
    },

    // Stream amount input handler
    {
      elementName: NativeTokenStreamDialogElementNames.StreamAmountInput,
      eventType: UserInputEventType.InputChangeEvent,
    },
    {
      elementName: NativeTokenStreamDialogElementNames.PeriodInput,
      eventType: UserInputEventType.InputChangeEvent,
    },

    // Adding Rules form handlers
    {
      elementName: RulesSelectorElementNames.AddMoreRulesPageToggle,
      eventType: UserInputEventType.ButtonClickEvent,
    },
    {
      elementName: NativeTokenStreamDialogElementNames.AddMoreRulesFormSubmit,
      eventType: UserInputEventType.FormSubmitEvent,
    },
    {
      elementName: NativeTokenStreamDialogElementNames.SelectedRuleDropdown,
      eventType: UserInputEventType.InputChangeEvent,
    },
    {
      elementName: NativeTokenStreamDialogElementNames.SelectedRuleInput,
      eventType: UserInputEventType.InputChangeEvent,
    },
    {
      elementName: NativeTokenStreamDialogElementNames.MaxAllowanceDropdown,
      eventType: UserInputEventType.InputChangeEvent,
    },

    // Remove Rules handlers
    {
      elementName: NativeTokenStreamDialogElementNames.MaxAllowanceRule,
      eventType: UserInputEventType.ButtonClickEvent,
    },
    {
      elementName: NativeTokenStreamDialogElementNames.InitialAmountRule,
      eventType: UserInputEventType.ButtonClickEvent,
    },
    {
      elementName: NativeTokenStreamDialogElementNames.StartTimeRule,
      eventType: UserInputEventType.ButtonClickEvent,
    },
    {
      elementName: NativeTokenStreamDialogElementNames.ExpiryRule,
      eventType: UserInputEventType.ButtonClickEvent,
    },
  ];

  /**
   * Resolves the button click event for the native-token-stream permission type.
   *
   * @param attenuatedContext - The attenuated context.
   * @param elementName - The name of the element that was clicked.
   * @returns The updated context.
   */
  #resolveButtonClickStateMutationHandler(
    attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>,
    elementName: string,
  ): PermissionConfirmationContext<SupportedPermissionTypes> | null {
    switch (elementName) {
      case NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded:
      case RulesSelectorElementNames.AddMoreRulesPageToggle:
        return handleToggleBooleanClicked({
          attenuatedContext,
          elementName,
        });
      case NativeTokenStreamDialogElementNames.MaxAllowanceRule:
      case NativeTokenStreamDialogElementNames.InitialAmountRule:
      case NativeTokenStreamDialogElementNames.StartTimeRule:
      case NativeTokenStreamDialogElementNames.ExpiryRule:
        return handleRemoveRuleClicked({
          attenuatedContext,
          elementName,
        });
      default:
        return null;
    }
  }

  /**
   * Resolves the input change event for the native-token-stream permission type.
   *
   * @param attenuatedContext - The attenuated context.
   * @param elementName - The name of the element that was changed.
   * @param value - The value of the element that was changed.
   * @returns The updated context.
   */
  #resolveInputChangeStateMutationHandler(
    attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>,
    elementName: string,
    value: string | boolean,
  ): PermissionConfirmationContext<SupportedPermissionTypes> | null {
    if (typeof value !== 'string') {
      return null;
    }

    switch (elementName) {
      case NativeTokenStreamDialogElementNames.StreamAmountInput:
        return handleReplaceValueInput({
          attenuatedContext,
          elementName,
          value,
        });
      case NativeTokenStreamDialogElementNames.PeriodInput:
      case NativeTokenStreamDialogElementNames.SelectedRuleDropdown:
      case NativeTokenStreamDialogElementNames.SelectedRuleInput:
      case NativeTokenStreamDialogElementNames.MaxAllowanceDropdown:
        return handleReplaceTextInput({
          attenuatedContext,
          elementName,
          value,
        });
      default:
        return null;
    }
  }

  /**
   * Resolves the form submit event for the native-token-stream permission type.
   *
   * @param attenuatedContext - The attenuated context.
   * @param elementName - The name of the element that was changed.
   * @param values - The values of the form.
   * @returns The updated context.
   */
  #resolveFormSubmitStateMutationHandler(
    attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>,
    elementName: string,
    values: Record<string, any>,
  ): PermissionConfirmationContext<SupportedPermissionTypes> | null {
    switch (elementName) {
      case NativeTokenStreamDialogElementNames.AddMoreRulesFormSubmit:
        return handleFormSubmit({
          attenuatedContext,
          values,
        });
      default:
        return null;
    }
  }

  protected getPermissionType(): 'native-token-stream' {
    return 'native-token-stream';
  }

  protected async parseAndValidate(basePermission: Permission) {
    const validatedPermission = parsePermission(basePermission);
    validatePermissionData(validatedPermission);

    return validatedPermission as PermissionTypeMapping['native-token-stream'];
  }

  protected buildPermissionConfirmation(
    context: PermissionConfirmationContext<'native-token-stream'>,
  ) {
    // @ts-expect-error - extractChain does not work well with dynamic `chains`
    const chain = extractChain({
      chains: Object.values(ALL_CHAINS),
      id: context.chainId as any,
    });
    const icons = ICONS[context.chainId];
    if (!icons) {
      throw new Error('No icon found');
    }
    const selectedRules = context.state.rules as Record<string, any>;

    return (
      <NativeTokenStreamConfirmationPage
        address={context.address}
        balance={context.balance}
        valueFormattedAsCurrency={context.valueFormattedAsCurrency}
        isAdjustmentAllowed={context.isAdjustmentAllowed}
        rulesFormProps={{
          addMoreRulesPageToggle:
            context.state[RulesSelectorElementNames.AddMoreRulesPageToggle],
          selectedRuleDropdownElementName:
            NativeTokenStreamDialogElementNames.SelectedRuleDropdown,
          selectedRuleInputElementName:
            NativeTokenStreamDialogElementNames.SelectedRuleInput,
          addMoreRulesFormSubmitElementName:
            NativeTokenStreamDialogElementNames.AddMoreRulesFormSubmit,
          selectedDropDownValue:
            context.state[
              NativeTokenStreamDialogElementNames.SelectedRuleDropdown
            ],
          selectedInputValue:
            context.state[
              NativeTokenStreamDialogElementNames.SelectedRuleInput
            ],
          ruleMeta: [
            {
              stateKey: NativeTokenStreamDialogElementNames.InitialAmountRule,
              name: 'Initial Amount',
              placeholder: '0.00',
              ruleValidator: {
                validationType: 'value-less-than-or-equal-to',
                emptyInputValidationError:
                  'Please enter a valid initial amount',
                inputConstraintValidationError: 'Not enough ETH available',
                compareValue: toHex(maxUint256), // don't fail validation when the balance is insufficient
              },
            },
            {
              stateKey: NativeTokenStreamDialogElementNames.MaxAllowanceRule,
              name: 'Max Allowance',
              placeholder: '0.00',
              ruleValidator: {
                validationType: 'value-less-than-or-equal-to',
                emptyInputValidationError: 'Please enter a valid max allowance',
                inputConstraintValidationError: 'Not enough ETH available',
                compareValue: toHex(maxUint256),
                unlimitedAllowanceDropDown: {
                  dropdownKey:
                    NativeTokenStreamDialogElementNames.MaxAllowanceDropdown,
                  dropdownValue:
                    context.state[
                      NativeTokenStreamDialogElementNames.MaxAllowanceDropdown
                    ],
                },
              },
            },
            {
              stateKey: NativeTokenStreamDialogElementNames.StartTimeRule,
              name: 'Start Time',
              placeholder: 'MM/DD/YYYY',
              ruleValidator: {
                validationType: 'timestamp-greater-than-or-equal-to',
                emptyInputValidationError: 'Enter a valid date',
                inputConstraintValidationError: 'Must be today or later',
                compareValue: getStartOfTodayUTC(),
              },
            },
            {
              stateKey: NativeTokenStreamDialogElementNames.ExpiryRule,
              name: 'Expiry',
              placeholder: 'MM/DD/YYYY',
              ruleValidator: {
                validationType: 'timestamp-greater-than-or-equal-to',
                emptyInputValidationError: 'Enter a valid date',
                inputConstraintValidationError: 'Must be after start time',
                compareValue: getStartOfNextDayUTC(), // todo: this should actually be the start time, not tomorrow
              },
            },
          ],
        }}
        streamProps={{
          streamAmount:
            context.state[
              NativeTokenStreamDialogElementNames.StreamAmountInput
            ],
          period:
            context.state[NativeTokenStreamDialogElementNames.PeriodInput],
          streamAmountElementName:
            NativeTokenStreamDialogElementNames.StreamAmountInput,
          periodElementName: NativeTokenStreamDialogElementNames.PeriodInput,
        }}
        requestDetailsProps={{
          itemDetails: [
            {
              label: 'Recipient',
              text: context.siteOrigin,
              tooltipText: 'Site receiving the token stream allowance.',
            },
            {
              label: 'Network',
              text: chain.name,
              iconUrl: icons.network,
            },
            {
              label: 'Token',
              text: 'ETH',
              iconUrl: icons.token,
            },
            {
              label: 'Reason',
              text: context.justification ?? 'No reason provided',
              tooltipText:
                'Reason given by the recipient for requesting this token stream allowance.',
            },
          ],
          isJustificationShowMoreExpanded:
            context.state[
              NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded
            ],
          justificationShowMoreExpandedElementName:
            NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded,
        }}
        rulesProps={{
          activeRuleStateKeys: Object.keys(selectedRules).filter(
            (key) => selectedRules[key] !== null && selectedRules[key],
          ),
          initialAmount:
            selectedRules[
              NativeTokenStreamDialogElementNames.InitialAmountRule
            ],
          maxAllowance:
            selectedRules[NativeTokenStreamDialogElementNames.MaxAllowanceRule],
          startTime:
            selectedRules[NativeTokenStreamDialogElementNames.StartTimeRule],
          expiry: selectedRules[NativeTokenStreamDialogElementNames.ExpiryRule],
          initialAmountEventName:
            NativeTokenStreamDialogElementNames.InitialAmountRule,
          maxAllowanceEventName:
            NativeTokenStreamDialogElementNames.MaxAllowanceRule,
          startTimeEventName: NativeTokenStreamDialogElementNames.StartTimeRule,
          expiryEventName: NativeTokenStreamDialogElementNames.ExpiryRule,
        }}
      />
    );
  }

  protected async appendPermissionCaveats(
    permissionContextMeta: PermissionContextMeta<'native-token-stream'>,
  ) {
    const { attenuatedPermission, caveatBuilder } = permissionContextMeta;

    const { initialAmount, maxAmount, amountPerSecond, startTime } =
      attenuatedPermission.data;

    const initialAmountBigInt =
      initialAmount === undefined ? 0n : BigInt(initialAmount);

    const maxAmountBigInt =
      maxAmount === undefined ? maxUint256 : BigInt(maxAmount);

    caveatBuilder
      .addCaveat(
        'nativeTokenStreaming',
        initialAmountBigInt,
        maxAmountBigInt,
        BigInt(amountPerSecond),
        startTime,
      )
      // don't allow any calldata as this could be used to extract additional authority
      // not included in a native token stream permission
      .addCaveat('exactCalldata', '0x');

    return caveatBuilder;
  }

  protected async resolveAttenuatedPermission(
    requestedPermission: PermissionTypeMapping['native-token-stream'],
    attenuatedContext: PermissionConfirmationContext<'native-token-stream'>,
  ) {
    const {
      state,
      expiry: requestedExpiry,
      isAdjustmentAllowed,
    } = attenuatedContext;

    let attenuatedPermission: PermissionTypeMapping['native-token-stream'];

    let expiry: number;

    if (isAdjustmentAllowed) {
      // If adjustment is allowed, we need to capture the user's adjusted values
      const attenuatedStreamAmount =
        state[NativeTokenStreamDialogElementNames.StreamAmountInput];
      const period = state[NativeTokenStreamDialogElementNames.PeriodInput];
      const attenuatedAmountPerSecond = toHex(
        BigInt(attenuatedStreamAmount) / BigInt(TIME_PERIOD_TO_SECONDS[period]),
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
          maxAmount: maxAllowanceParser(attenuatedMaxAllowance ?? 'Unlimited'),
          amountPerSecond: attenuatedAmountPerSecond,
          initialAmount: zeroDefaultParser(attenuatedInitialAmount),
          startTime: attenuatedStartTime
            ? convertReadableDateToTimestamp(attenuatedStartTime)
            : requestedPermission.data.startTime,
          justification: requestedPermission.data.justification,
        },
      };

      expiry = attenuatedExpiry
        ? convertReadableDateToTimestamp(attenuatedExpiry)
        : requestedExpiry;
    } else {
      // no adjustment allowed, just need to add defaults to requested values
      // todo: do we even need to add defaults here?
      attenuatedPermission = {
        type: 'native-token-stream',
        data: {
          ...requestedPermission.data,
          initialAmount: requestedPermission.data.initialAmount ?? '0x0',
          maxAmount: requestedPermission.data.maxAmount ?? toHex(maxUint256),
        },
      };
      expiry = requestedExpiry;
    }

    return {
      attenuatedPermission,
      expiry,
    };
  }

  protected getTokenCaipAssetType(
    _: PermissionTypeMapping['native-token-stream'],
    _chainId: number,
  ) {
    // TODO: Use the chainId to determine the native asset type since native token is not always ETH on all chains
    return `eip155:1/slip44:60` as CaipAssetType;
  }

  protected async handleUserEventHandler<
    TUserInputEventType extends UserInputEventType,
  >(args: {
    event: UserInputEventByType<TUserInputEventType>;
    attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
    interfaceId: string;
  }): Promise<void> {
    const { attenuatedContext, interfaceId, event } = args;
    const elementName = event.name ?? '';
    const eventType = event.type;

    // call behavior to update state specific to element type and element name
    let updatedContext: PermissionConfirmationContext<SupportedPermissionTypes> | null =
      null;
    switch (eventType) {
      case UserInputEventType.ButtonClickEvent:
        updatedContext = this.#resolveButtonClickStateMutationHandler(
          attenuatedContext,
          elementName,
        );
        break;
      case UserInputEventType.InputChangeEvent:
        updatedContext = this.#resolveInputChangeStateMutationHandler(
          attenuatedContext,
          elementName,
          event.value,
        );
        break;
      case UserInputEventType.FormSubmitEvent:
        updatedContext = this.#resolveFormSubmitStateMutationHandler(
          attenuatedContext,
          elementName,
          event.value,
        );
        break;
      default:
        return;
    }

    if (updatedContext) {
      await this.updateActiveInterface(interfaceId, updatedContext);
    }
  }

  protected getConfirmationDialogEventHandlers(
    permission: PermissionTypeMapping['native-token-stream'],
    expiry: number,
  ) {
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
          [NativeTokenStreamDialogElementNames.MaxAllowanceRule]:
            permission.data.maxAmount === undefined ||
            BigInt(permission.data.maxAmount) === maxUint256
              ? 'Unlimited'
              : formatTokenBalance(permission.data.maxAmount),
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

      dialogContentEventHandlers: this.#elementNameMapping.map(
        ({ elementName, eventType }) => ({
          elementName,
          eventType,
          handler: this.handleUserEventHandler.bind(
            this,
          ) as UserEventHandler<UserInputEventType>,
        }),
      ),
    };
  }
}
