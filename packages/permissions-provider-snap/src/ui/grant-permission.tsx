import type {
  PermissionRequest,
  Permission,
} from '@metamask/7715-permissions-shared/types';
import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Button,
  Container,
  Divider,
  Footer,
} from '@metamask/snaps-sdk/jsx';

import { Header, RequestDetails } from './components';
import { GRANT_BUTTON, CANCEL_BUTTON } from './user-input.contant';

export type GrantPermissionContext = {
  permissionRequest: PermissionRequest;
  siteOrigin: string;
};

export type GrantPermissionPageProps = {
  siteOrigin: string;
  permission: Permission;
};

export const GrantPermissonPage: SnapComponent<GrantPermissionPageProps> = ({
  siteOrigin,
  permission,
}) => {
  return (
    <Container>
      <Box>
        <Header
          title="Permission request(mock)"
          subtitle="Choose the account you want to use, then customize rules to be followed before a transaction is made."
        />
        <Divider />

        <RequestDetails siteOrigin={siteOrigin} permission={permission} />
      </Box>
      <Footer>
        <Button name={CANCEL_BUTTON} variant="destructive">
          Cancel
        </Button>
        <Button name={GRANT_BUTTON} variant="primary">
          Grant
        </Button>
      </Footer>
    </Container>
  );
};
