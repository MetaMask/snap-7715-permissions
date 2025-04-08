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

  AddMoreRulesToggle = 'add-more-rules-toggle-native-token-stream',
  SaveRuleButton = 'save-rule-button-native-token-stream',
  SelectedRuleDropdown = 'selected-rule-dropdown-native-token-stream',

  InitialAmountRule = 'initial-amount-rule-native-token-stream',
  InitialAmountRemove = 'initial-amount-remove-native-token-stream',

  MaxAllowanceRule = 'max-allowance-rule-native-token-stream',
  MaxAllowanceRemove = 'max-allowance-remove-native-token-stream',

  StartTimeRule = 'start-time-rule-native-token-stream',
  StartTimeRemove = 'start-time-remove-native-token-stream',

  ExpiryRule = 'expiry-rule-native-token-stream',
  ExpiryRemove = 'expiry-remove-native-token-stream',
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
  const ruleStateKeys = [
    NativeTokenStreamDialogElementNames.InitialAmountRule,
    NativeTokenStreamDialogElementNames.MaxAllowanceRule,
    NativeTokenStreamDialogElementNames.StartTimeRule,
    NativeTokenStreamDialogElementNames.ExpiryRule,
  ];

  const ruleMeta: RuleMeta[] = [
    {
      stateKey: NativeTokenStreamDialogElementNames.InitialAmountRule,
      name: 'Initial Amount',
    },
    {
      stateKey: NativeTokenStreamDialogElementNames.MaxAllowanceRule,
      name: 'Max Allowance',
    },
    {
      stateKey: NativeTokenStreamDialogElementNames.StartTimeRule,
      name: 'Start Time',
    },
    {
      stateKey: NativeTokenStreamDialogElementNames.ExpiryRule,
      name: 'Expiry',
    },
  ];

  if (state[NativeTokenStreamDialogElementNames.AddMoreRulesToggle]) {
    return (
      <Box>
        <RulesSelector
          closeRuleSelectorButtonEventName={
            NativeTokenStreamDialogElementNames.AddMoreRulesToggle
          }
          saveRuleButtonEventName={
            NativeTokenStreamDialogElementNames.SaveRuleButton
          }
          selectedRuleDropdownEventName={
            NativeTokenStreamDialogElementNames.SelectedRuleDropdown
          }
          state={state}
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
        justificationShowMoreExpandedEventName={
          NativeTokenStreamDialogElementNames.JustificationShowMoreExpanded
        }
      />

      <AccountDetails
        account={accountDetailsProps.account}
        senderDetails={accountDetailsProps.senderDetails}
      />

      <StreamAmount
        maxAmount={state[NativeTokenStreamDialogElementNames.MaxAmountInput]}
        maxAmountEventName={NativeTokenStreamDialogElementNames.MaxAmountInput}
        period={state[NativeTokenStreamDialogElementNames.PeriodInput]}
        periodEventName={NativeTokenStreamDialogElementNames.PeriodInput}
      />

      <NativeTokenStreamRules
        initialAmount={
          state[NativeTokenStreamDialogElementNames.InitialAmountRule]
        }
        maxAllowance={
          state[NativeTokenStreamDialogElementNames.MaxAllowanceRule]
        }
        startTime={state[NativeTokenStreamDialogElementNames.StartTimeRule]}
        expiry={state[NativeTokenStreamDialogElementNames.ExpiryRule]}
        initialAmountRemoveEventName={
          NativeTokenStreamDialogElementNames.InitialAmountRemove
        }
        initialAmountInputEventName={
          NativeTokenStreamDialogElementNames.InitialAmountRule
        }
        maxAllowanceRemoveEventName={
          NativeTokenStreamDialogElementNames.MaxAllowanceRemove
        }
        maxAllowanceInputEventName={
          NativeTokenStreamDialogElementNames.MaxAllowanceRule
        }
        startTimeRemoveEventName={
          NativeTokenStreamDialogElementNames.StartTimeRemove
        }
        startTimeInputEventName={
          NativeTokenStreamDialogElementNames.StartTimeRule
        }
        expiryRemoveEventName={NativeTokenStreamDialogElementNames.ExpiryRemove}
        expiryInputEventName={NativeTokenStreamDialogElementNames.ExpiryRule}
      />

      <AddMoreRule
        ruleStateKeys={ruleStateKeys}
        state={state}
        addMoreButtonEventName={
          NativeTokenStreamDialogElementNames.AddMoreRulesToggle
        }
      />
    </Box>
  );
};
