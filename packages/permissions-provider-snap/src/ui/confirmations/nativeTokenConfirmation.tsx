import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box } from '@metamask/snaps-sdk/jsx';

import type { AccountDetailsProps, RuleMeta } from '../components';
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
import type { PermissionConfirmationProps } from '../types';

/**
 * The event names for the native-token-stream permission confirmation page.
 * These events are used to handle user interactions with the confirmation page.
 */
export enum NativeTokenStreamDialogElementNames {
  JustificationShowMoreExpanded = 'justification-show-more-button-native-token-stream',
  MaxAmountInput = 'max-amount-input-native-token-stream',
  PeriodInput = 'period-input-native-token-stream',

  AddMoreRulesFormSubmit = 'add-more-rules-form-submit-native-token-stream',
  SelectedRuleDropdown = 'selected-rule-dropdown-native-token-stream',
  SelectedRuleInput = 'selected-rule-input-native-token-stream',

  InitialAmountRule = 'initial-amount-rule-native-token-stream',
  MaxAllowanceRule = 'max-allowance-rule-native-token-stream',
  StartTimeRule = 'start-time-rule-native-token-stream',
  ExpiryRule = 'expiry-rule-native-token-stream',
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
      tooltip: 'Tooltip text',
    },
  };
  const ruleMeta: RuleMeta[] = [
    {
      stateKey: NativeTokenStreamDialogElementNames.InitialAmountRule,
      name: 'Initial Amount',
      inputType: 'number',
      placeholder: '0.00',
      validation: {
        validationError: 'Please enter a valid initial amount',
      },
    },
    {
      stateKey: NativeTokenStreamDialogElementNames.MaxAllowanceRule,
      name: 'Max Allowance',
      inputType: 'number',
      placeholder: '0.00',
      validation: {
        validationError: 'Please enter a valid max allowance',
      },
    },
    {
      stateKey: NativeTokenStreamDialogElementNames.StartTimeRule,
      name: 'Start Time',
      inputType: 'text',
      placeholder: 'MM/DD/YYYY',
      validation: {
        validationError: 'Enter a valid date',
      },
    },
    {
      stateKey: NativeTokenStreamDialogElementNames.ExpiryRule,
      name: 'Expiry',
      inputType: 'text',
      placeholder: 'MM/DD/YYYY',
      validation: {
        validationError: 'Enter a valid date',
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
          selectedRuleDropdownEventName={
            NativeTokenStreamDialogElementNames.SelectedRuleDropdown
          }
          selectedRuleInputEventName={
            NativeTokenStreamDialogElementNames.SelectedRuleInput
          }
          addMoreRulesFormSubmitEventName={
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

  return (
    <Box>
      <RequestHeader title="Create a token stream" />

      <RequestDetails
        siteOrigin={siteOrigin}
        chainId={chainId}
        justification={justification}
        asset={asset}
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
        streamAmount={state[NativeTokenStreamDialogElementNames.MaxAmountInput]}
        streamAmountElementName={
          NativeTokenStreamDialogElementNames.MaxAmountInput
        }
        period={state[NativeTokenStreamDialogElementNames.PeriodInput]}
        periodElementName={NativeTokenStreamDialogElementNames.PeriodInput}
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
        />
      )}

      <AddMoreRule
        activeRuleStateKeys={activeRuleStateKeys}
        ruleMeta={ruleMeta}
      />
    </Box>
  );
};
