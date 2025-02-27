import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Button,
  Container,
  Divider,
  Footer,
} from '@metamask/snaps-sdk/jsx';

import { Header, RequestDetails } from '../components';
import type { PermissionConfirmationProps } from '../ui.types';
import { CANCEL_BUTTON, GRANT_BUTTON } from '../user-input.contant';

/**
 * The native-token-stream permission confirmation page.
 *
 * @param props - The permission confirmation props.
 * @param props.siteOrigin - The site origin.
 * @param props.permission - The native-token-stream permission data.
 * @returns The JSX element to render.
 */
export const NativeTokenStreamConfirmationPage: SnapComponent<
  PermissionConfirmationProps<'native-token-stream'>
> = ({ siteOrigin, permission }) => {
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
          chainId={permission.data.chainId}
          justification={permission.data.justification}
        />

        {/* <ConfirmationFooter /> */}
        <Footer>
          <Button name={CANCEL_BUTTON} variant="destructive">
            Cancel
          </Button>
          <Button name={GRANT_BUTTON} variant="primary">
            Grant
          </Button>
        </Footer>
      </Box>
    </Container>
  );
};
