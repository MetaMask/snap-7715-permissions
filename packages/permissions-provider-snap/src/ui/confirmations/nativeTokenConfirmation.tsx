import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box } from '@metamask/snaps-sdk/jsx';
import { extractChain } from 'viem';
import * as ALL_CHAINS from 'viem/chains';

import type { AccountDetailsProps, ItemDetails } from '../components';
import {
  AccountDetails,
  RequestHeader,
  RequestDetails,
  StreamAmount,
  NativeTokenStreamRules,
  RulesSelector,
} from '../components';
import { ICONS } from '../iconConstant';
import type { PermissionConfirmationProps } from '../types';

/**
 * The event names for the native-token-stream permission confirmation page.
 * These events are used to handle user interactions with the confirmation page.
 */
export enum NativeTokenStreamDialogElementNames {
  JustificationShowMoreExpanded = 'justification-show-more-button-native-token-stream',
  MaxAmountInput = 'max-amount-input-native-token-stream',
  PeriodInput = 'period-input-native-token-stream',
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
 * @param props.expiry - The unix timestamp in seconds when the granted permission is set to expire.
 * @param props.valueFormattedAsCurrency - The account balance formatted as currency that matches the user's preferences.
 * @param props.permissionSpecificRules - The permission rules.
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
  expiry,
  valueFormattedAsCurrency,
  permissionSpecificRules,
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
      tooltip: 'The account that the token stream comes from.',
    },
  };

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
        streamAmount={state[NativeTokenStreamDialogElementNames.MaxAmountInput]}
        streamAmountElementName={
          NativeTokenStreamDialogElementNames.MaxAmountInput
        }
        period={state[NativeTokenStreamDialogElementNames.PeriodInput]}
        periodElementName={NativeTokenStreamDialogElementNames.PeriodInput}
      />

      <NativeTokenStreamRules
        permissionSpecificRules={permissionSpecificRules}
        expiry={expiry}
      />

      <RulesSelector permissionSpecificRules={permissionSpecificRules} />
    </Box>
  );
};
