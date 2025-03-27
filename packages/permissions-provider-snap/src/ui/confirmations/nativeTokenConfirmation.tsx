import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box } from '@metamask/snaps-sdk/jsx';

import type { AccountDetailsProps } from '../components';
import {
  AccountDetails,
  RequestHeader,
  RequestDetails,
  NativeTokenStreamRules,
} from '../components';
import type { PermissionConfirmationProps } from '../types';

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
 * @param props.permissionSpecificRules - The permission rules.
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
  permissionSpecificRules,
}) => {
  const asset = 'ETH';
  const accountDetailsProps: AccountDetailsProps = {
    accounts: [
      {
        address,
        balance,
        asset,
      },
    ],
    permissionIndex: 0,
  };
  return (
    <Box>
      <RequestHeader title="Create a token stream" />

      <RequestDetails
        siteOrigin={siteOrigin}
        chainId={chainId}
        justification={permission.data.justification}
        asset={asset}
      />

      <AccountDetails
        accounts={accountDetailsProps.accounts}
        permissionIndex={accountDetailsProps.permissionIndex}
      />

      <NativeTokenStreamRules
        permissionSpecificRules={permissionSpecificRules}
        expiry={expiry}
      />
    </Box>
  );
};
