import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box } from '@metamask/snaps-sdk/jsx';
import { extractChain, maxUint256, toHex } from 'viem';
import * as ALL_CHAINS from 'viem/chains';

import { getStartOfNextDayUTC, getStartOfTodayUTC } from '../../utils';
import type {
  AccountDetailsProps,
  ItemDetails,
  RuleMeta,
  RuleValidationTypes,
} from '../components';
import {
  AccountDetails,
  RequestHeader,
  RequestDetails,
  StreamAmount,
  NativeTokenStreamRules,
  AddMoreRule,
  RulesSelector,
  RulesSelectorElementNames,
  filterNotActiveRuleMeta,
} from '../components';
import { ICONS } from '../iconConstant';
import type { PermissionConfirmationProps } from '../types';

/**
 * The event names for the native-token-stream permission confirmation page.
 * These events are used to handle user interactions with the confirmation page.
 */
export enum NativeTokenStreamDialogElementNames {
  JustificationShowMoreExpanded = 'justification-show-more-button-native-token-stream',
  StreamAmountInput = 'max-amount-input-native-token-stream',
  PeriodInput = 'period-input-native-token-stream',

  AddMoreRulesFormSubmit = 'add-more-rules-form-submit-native-token-stream',
  SelectedRuleDropdown = 'selected-rule-dropdown-native-token-stream',
  SelectedRuleInput = 'selected-rule-input-native-token-stream',

  InitialAmountRule = 'initial-amount-rule-native-token-stream',
  MaxAllowanceRule = 'max-allowance-rule-native-token-stream',
  StartTimeRule = 'start-time-rule-native-token-stream',
  ExpiryRule = 'expiry-rule-native-token-stream',
  MaxAllowanceDropdown = 'max-allowance-dropdown-native-token-stream',
}

/**
 * The native-token-stream permission confirmation page.
 *
 * @param props - The permission confirmation props.
 * @param props.siteOrigin - The site origin.
 * @param props.justification - The justification for the permission.
 * @param props.chainId - The chain ID.
 * @param props.address - The account address.
 * @param props.balance - The account balance.
 * @param props.valueFormattedAsCurrency - The account balance formatted as currency that matches the user's preferences.
 * @param props.state - The state of the dynamic components.
 * @param props.isAdjustmentAllowed - Whether the permission can be adjusted.
 * @returns The JSX element to render.
 */
export const NativeTokenStreamConfirmationPage: SnapComponent<
  PermissionConfirmationProps<'native-token-stream'>
> = ({
  siteOrigin,
  justification,
  chainId,
  address,
  balance,
  valueFormattedAsCurrency,
  state,
  isAdjustmentAllowed,
}) => {
  const asset = 'ETH';
  const accountDetailsProps: AccountDetailsProps = {
    account: {
      address,
      balance,
      valueFormattedAsCurrency,
    },
    senderDetails: {
      title: 'Stream from',
      tooltip: 'The account that the token stream comes from.',
    },
  };

  const ruleMeta: RuleMeta<RuleValidationTypes>[] = [
    {
      stateKey: NativeTokenStreamDialogElementNames.InitialAmountRule,
      name: 'Initial Amount',
      placeholder: '0.00',
      ruleValidator: {
        validationType: 'value-less-than-or-equal-to',
        emptyInputValidationError: 'Please enter a valid initial amount',
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
          dropdownKey: NativeTokenStreamDialogElementNames.MaxAllowanceDropdown,
          dropdownValue:
            state[NativeTokenStreamDialogElementNames.MaxAllowanceDropdown],
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
  ];

  const stateRules = state.rules as Record<string, any>;
  const activeRuleStateKeys = Object.keys(stateRules).filter(
    (key) => stateRules[key] !== null && stateRules[key],
  );
  const isActiveRulesEmpty =
    filterNotActiveRuleMeta(ruleMeta, activeRuleStateKeys).length !==
    ruleMeta.length;

  if (state[RulesSelectorElementNames.AddMoreRulesPageToggle]) {
    return (
      <Box>
        <RulesSelector
          selectedRuleDropdownElementName={
            NativeTokenStreamDialogElementNames.SelectedRuleDropdown
          }
          selectedRuleInputElementName={
            NativeTokenStreamDialogElementNames.SelectedRuleInput
          }
          addMoreRulesFormSubmitElementName={
            NativeTokenStreamDialogElementNames.AddMoreRulesFormSubmit
          }
          activeRuleStateKeys={activeRuleStateKeys}
          selectedDropDownValue={
            state[NativeTokenStreamDialogElementNames.SelectedRuleDropdown]
          }
          selectedInputValue={
            state[NativeTokenStreamDialogElementNames.SelectedRuleInput]
          }
          ruleMeta={ruleMeta}
        />
      </Box>
    );
  }

  // @ts-expect-error - extractChain does not work well with dynamic `chains`
  const chain = extractChain({
    chains: Object.values(ALL_CHAINS),
    id: chainId as any,
  });
  const icons = ICONS[chainId];
  if (!icons) {
    throw new Error('No icon found');
  }

  const items: ItemDetails[] = [
    {
      label: 'Recipient',
      text: siteOrigin,
      tooltipText: 'Site receiving the token stream allowance.',
    },
    {
      label: 'Network',
      text: chain.name,
      iconUrl: icons.network,
    },
    {
      label: 'Token',
      text: asset,
      iconUrl: icons.token,
    },
    {
      label: 'Reason',
      text: justification ?? 'No reason provided',
      tooltipText:
        'Reason given by the recipient for requesting this token stream allowance.',
    },
  ];

  return (
    <Box>
      <RequestHeader title="Create a token stream" />

      <RequestDetails
        itemDetails={items}
        isJustificationShowMoreExpanded={
          state[
            NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded
          ]
        }
        justificationShowMoreExpandedElementName={
          NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded
        }
      />

      <AccountDetails
        account={accountDetailsProps.account}
        senderDetails={accountDetailsProps.senderDetails}
      />

      <StreamAmount
        streamAmount={
          state[NativeTokenStreamDialogElementNames.StreamAmountInput]
        }
        streamAmountElementName={
          NativeTokenStreamDialogElementNames.StreamAmountInput
        }
        period={state[NativeTokenStreamDialogElementNames.PeriodInput]}
        periodElementName={NativeTokenStreamDialogElementNames.PeriodInput}
        isAdjustmentAllowed={isAdjustmentAllowed}
      />

      {isActiveRulesEmpty && (
        <NativeTokenStreamRules
          initialAmount={
            state.rules[NativeTokenStreamDialogElementNames.InitialAmountRule]
          }
          maxAllowance={
            state.rules[NativeTokenStreamDialogElementNames.MaxAllowanceRule]
          }
          startTime={
            state.rules[NativeTokenStreamDialogElementNames.StartTimeRule]
          }
          expiry={state.rules[NativeTokenStreamDialogElementNames.ExpiryRule]}
          initialAmountEventName={
            NativeTokenStreamDialogElementNames.InitialAmountRule
          }
          maxAllowanceEventName={
            NativeTokenStreamDialogElementNames.MaxAllowanceRule
          }
          startTimeEventName={NativeTokenStreamDialogElementNames.StartTimeRule}
          expiryEventName={NativeTokenStreamDialogElementNames.ExpiryRule}
          isAdjustmentAllowed={isAdjustmentAllowed}
        />
      )}

      <AddMoreRule
        activeRuleStateKeys={activeRuleStateKeys}
        ruleMeta={ruleMeta}
        isAdjustmentAllowed={isAdjustmentAllowed}
      />
    </Box>
  );
};
