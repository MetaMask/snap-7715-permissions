import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Container, Divider } from '@metamask/snaps-sdk/jsx';

import { ConfirmationFooter, Header, RequestDetails } from '../components';
import type { PermissionConfirmationProps } from '../ui.types';

/**
 * The native-token-stream permission confirmation page.
 *
 * @param props - The permission confirmation props.
 * @param props.siteOrigin - The site origin.
 * @param props.permission - The native-token-stream permission data.
 * @param props.chainId - The chain ID.
 * @returns The JSX element to render.
 */
export const NativeTokenStreamConfirmationPage: SnapComponent<
  PermissionConfirmationProps<'native-token-stream'>
> = ({ siteOrigin, permission, chainId }) => {
  return (
    <Container>
      <Box>
        <Header
          title="Permission request(native-token-stream)"
          subtitle="Choose the account you want to use, then customize rules to be followed before a transaction is made."
        />
        <Divider />

        <RequestDetails
          siteOrigin={siteOrigin}
          chainId={chainId}
          justification={permission.data.justification}
        />
      </Box>
      <ConfirmationFooter />
    </Container>
  );
};
