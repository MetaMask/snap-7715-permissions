import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Divider } from '@metamask/snaps-sdk/jsx';

import type { AccountDetailsProps } from '../components';
import { AccountDetails, Header, RequestDetails } from '../components';
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
 * @returns The JSX element to render.
 */
export const NativeTokenStreamConfirmationPage: SnapComponent<
  PermissionConfirmationProps<'native-token-stream'>
> = ({ siteOrigin, permission, chainId, address, balance }) => {
  const accountDetailsProps: AccountDetailsProps = {
    account: {
      address,
      assetBalance: balance,
      value: 1000.5,
    },
    senderDetails: {
      title: 'Stream from',
      tooltip: 'Tooltip text',
    },
  };
  return (
    <Box>
      <Header
        title="Permission request"
        subtitle="<place holder subtitle for native-token-stream>"
      />
      <Divider />

      <RequestDetails
        siteOrigin={siteOrigin}
        chainId={chainId}
        justification={permission.data.justification}
      />

      <AccountDetails
        account={accountDetailsProps.account}
        senderDetails={accountDetailsProps.senderDetails}
      />
    </Box>
  );
};
