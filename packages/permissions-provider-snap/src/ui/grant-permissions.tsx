import type { SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Button,
  Container,
  Divider,
  Footer,
} from '@metamask/snaps-sdk/jsx';
import type { Address } from 'viem';

import type { PermissionRequestIteratorItem } from '../iterator';
import {
  Header,
  RequestDetails,
  AccountDetails,
  SpendingCapDetails,
  Pagination,
} from './components';
import { GRANT_BUTTON, CANCEL_BUTTON } from './user-input.contant';

export type GrantPermissionsContext = {
  siteOrigin: string;
  accounts: Address[];
};

export type GrantPermissionsPageProps = {
  siteOrigin: string;
  accounts: Address[];
  permissionRequestIteratorItem: PermissionRequestIteratorItem | null;
  iteratorItemMetadata: {
    isFirst: boolean;
    isLast: boolean;
    permissionIndex: number;
  };
  areAllSettled: boolean;
};

export const GrantPermissionsPage: SnapComponent<GrantPermissionsPageProps> = ({
  permissionRequestIteratorItem,
  siteOrigin,
  accounts,
  iteratorItemMetadata,
  areAllSettled,
}) => {
  if (!permissionRequestIteratorItem) {
    throw new Error('permission not found');
  }

  if (accounts.length === 0) {
    throw new Error('no accounts found');
  }

  const { permissionRequest } = permissionRequestIteratorItem;
  const { isFirst, isLast, permissionIndex } = iteratorItemMetadata;

  return (
    <Container>
      <Box>
        <Header
          title="Permission request"
          subtitle="Choose the account you want to use, then customize rules to be followed before a transaction is made."
        />
        <Divider />

        <Pagination isFirst={isFirst} isLast={isLast} />

        <RequestDetails
          siteOrigin={siteOrigin}
          chainId={permissionRequest.chainId}
          permission={permissionRequest.permission}
        />

        <AccountDetails accounts={accounts} permissionIndex={permissionIndex} />

        <SpendingCapDetails permission={permissionRequest.permission} />
      </Box>
      <Footer>
        <Button name={CANCEL_BUTTON} variant="destructive">
          Cancel
        </Button>
        <Button name={GRANT_BUTTON} variant="primary" disabled={!areAllSettled}>
          Grant
        </Button>
      </Footer>
    </Container>
  );
};
