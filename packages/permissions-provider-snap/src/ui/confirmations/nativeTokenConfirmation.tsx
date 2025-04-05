import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box } from '@metamask/snaps-sdk/jsx';

import type { AccountDetailsProps } from '../components';
import {
  AccountDetails,
  RequestHeader,
  RequestDetails,
  StreamAmount,
  NativeTokenStreamRules,
  RulesSelector,
} from '../components';
import type { PermissionConfirmationProps } from '../types';

/**
 * The event names for the native-token-stream permission confirmation page.
 * These events are used to handle user interactions with the confirmation page.
 */
export enum NativeTokenStreamDialogEventNames {
  JustificationShowMoreExpanded = 'request-details.show-more-button-native-token-stream',
}

/**
 * The native-token-stream permission confirmation page.
 *
 * @param props - The permission confirmation props.
 * @param props.siteOrigin - The site origin.
 * @param props.permission - The native-token-stream permission data.
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
  permission,
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
      tooltip: 'Tooltip text',
    },
  };
  return (
    <Box>
      <RequestHeader title="Create a token stream" />

      <RequestDetails
        siteOrigin={siteOrigin}
        chainId={chainId}
        justification={permission.data.justification}
        asset={asset}
        isJustificationShowMoreExpanded={
          state[NativeTokenStreamDialogEventNames.JustificationShowMoreExpanded]
        }
        justificationShowMoreExpandedEventName={
          NativeTokenStreamDialogEventNames.JustificationShowMoreExpanded
        }
      />

      <AccountDetails
        account={accountDetailsProps.account}
        senderDetails={accountDetailsProps.senderDetails}
      />

      <StreamAmount maxAmount={permission.data.maxAmount} />

      <NativeTokenStreamRules
        permissionSpecificRules={permissionSpecificRules}
        expiry={expiry}
      />

      <RulesSelector permissionSpecificRules={permissionSpecificRules} />
    </Box>
  );
};
