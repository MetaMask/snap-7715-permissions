import { Box } from '@metamask/snaps-sdk/jsx';
import type { SnapComponent, JsonObject } from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';

import type {
  AccountDetailsProps,
  ItemDetails,
  PermissionConfirmationContext,
  RuleMeta,
  RuleValidationTypes,
  TimePeriod,
} from '../../../confirmation';
import {
  AccountDetails,
  RequestHeader,
  RequestDetails,
  StreamAmount,
  AddMoreRule,
  RulesSelector,
  filterNotActiveRuleMeta,
} from '../../../confirmation';
import type { SupportedPermissionTypes } from '../../types';
import { NativeTokenStreamRules } from './components';

/**
 * The props for specific permission confirmation pages.
 */
export type PermissionConfirmationProps<
  TPermissionType extends SupportedPermissionTypes,
> = JsonObject &
  Pick<
    PermissionConfirmationContext<TPermissionType>,
    'address' | 'balance' | 'valueFormattedAsCurrency' | 'isAdjustmentAllowed'
  > & {
    rulesFormProps: RuleFormProps;
    streamProps: StreamProps;
    requestDetailsProps: RequestDetailsProps;
    rulesProps: RulesProps;
  };

type RuleFormProps = {
  addMoreRulesPageToggle: boolean;
  selectedRuleDropdownElementName: string;
  selectedRuleInputElementName: string;
  addMoreRulesFormSubmitElementName: string;

  selectedDropDownValue: string;
  selectedInputValue: string;
  ruleMeta: RuleMeta<RuleValidationTypes>[];
};

type StreamProps = {
  streamAmount: Hex;
  streamAmountElementName: string;
  period: TimePeriod;
  periodElementName: string;
};

type RequestDetailsProps = {
  itemDetails: ItemDetails[];
  isJustificationShowMoreExpanded: boolean;
  justificationShowMoreExpandedElementName: string;
};

type RulesProps = {
  activeRuleStateKeys: string[];
  initialAmount: string | null;
  maxAllowance: string | null;
  startTime: string | null;
  expiry: string | null;

  initialAmountEventName: string;
  maxAllowanceEventName: string;
  startTimeEventName: string;
  expiryEventName: string;
};

/**
 * The native-token-stream permission confirmation page.
 *
 * @param props - The permission confirmation props.
 * @param props.address - The account address.
 * @param props.balance - The account balance.
 * @param props.valueFormattedAsCurrency - The account balance formatted as currency that matches the user's preferences.
 * @param props.isAdjustmentAllowed - Whether the permission can be adjusted.
 * @param props.rulesFormProps - The props for the rule components.
 * @param props.streamProps - The props for the stream components.
 * @param props.requestDetailsProps - The props for the request details components.
 * @param props.rulesProps - The props for the rules components.
 * @returns The JSX element to render.
 */
export const NativeTokenStreamConfirmationPage: SnapComponent<
  PermissionConfirmationProps<'native-token-stream'>
> = ({
  address,
  balance,
  valueFormattedAsCurrency,
  isAdjustmentAllowed,
  rulesFormProps,
  streamProps,
  requestDetailsProps,
  rulesProps,
}) => {
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
  const {
    addMoreRulesPageToggle,
    selectedRuleDropdownElementName,
    selectedRuleInputElementName,
    addMoreRulesFormSubmitElementName,
    selectedDropDownValue,
    selectedInputValue,
    ruleMeta,
  } = rulesFormProps;
  const { streamAmount, streamAmountElementName, period, periodElementName } =
    streamProps;
  const {
    itemDetails,
    isJustificationShowMoreExpanded,
    justificationShowMoreExpandedElementName,
  } = requestDetailsProps;

  const {
    activeRuleStateKeys,
    initialAmount,
    maxAllowance,
    startTime,
    expiry,
    initialAmountEventName,
    maxAllowanceEventName,
    startTimeEventName,
    expiryEventName,
  } = rulesProps;
  const isActiveRulesEmpty =
    filterNotActiveRuleMeta(ruleMeta, activeRuleStateKeys).length !==
    ruleMeta.length;

  if (addMoreRulesPageToggle) {
    return (
      <Box>
        <RulesSelector
          selectedRuleDropdownElementName={selectedRuleDropdownElementName}
          selectedRuleInputElementName={selectedRuleInputElementName}
          addMoreRulesFormSubmitElementName={addMoreRulesFormSubmitElementName}
          activeRuleStateKeys={activeRuleStateKeys}
          selectedDropDownValue={selectedDropDownValue}
          selectedInputValue={selectedInputValue}
          ruleMeta={ruleMeta}
        />
      </Box>
    );
  }

  return (
    <Box>
      <RequestHeader title="Create a token stream" />

      <RequestDetails
        itemDetails={itemDetails}
        isJustificationShowMoreExpanded={isJustificationShowMoreExpanded}
        justificationShowMoreExpandedElementName={
          justificationShowMoreExpandedElementName
        }
      />

      <AccountDetails
        account={accountDetailsProps.account}
        senderDetails={accountDetailsProps.senderDetails}
      />

      <StreamAmount
        streamAmount={streamAmount}
        streamAmountElementName={streamAmountElementName}
        period={period}
        periodElementName={periodElementName}
        isAdjustmentAllowed={isAdjustmentAllowed}
      />

      {isActiveRulesEmpty && (
        <NativeTokenStreamRules
          initialAmount={initialAmount}
          maxAllowance={maxAllowance}
          startTime={startTime}
          expiry={expiry}
          initialAmountEventName={initialAmountEventName}
          maxAllowanceEventName={maxAllowanceEventName}
          startTimeEventName={startTimeEventName}
          expiryEventName={expiryEventName}
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
