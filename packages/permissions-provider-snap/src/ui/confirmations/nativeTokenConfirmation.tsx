import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import { Box, Container, Divider } from '@metamask/snaps-sdk/jsx';

import { ConfirmationFooter, Header, RequestDetails } from '../components';
import type { PermissionConfirmationProps } from '../types';

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
          subtitle="<place holder subtitle>"
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
