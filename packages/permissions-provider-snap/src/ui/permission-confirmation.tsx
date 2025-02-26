import type { Permission } from '@metamask/7715-permissions-shared/types';
import type { InterfaceContext } from '@metamask/snaps-sdk';
import type { JsonObject, SnapComponent } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Button,
  Container,
  Divider,
  Footer,
} from '@metamask/snaps-sdk/jsx';
import type { Hex } from 'viem';

import { Header, RequestDetails } from './components';

/**
 * The A custom Snap context object for the permission confirmation page that will be passed to onUserInput when the user interacts with the interface.
 * The following actions are expected to be performed on the context object:
 * - User attenuation reflected on the context object(ie. adjusting the permission data).
 * - Dynamic updates to delegation data reflected on the context object.
 * - immutable vaules expected not to change are set to readonly.
 */
export type PermissionConfirmationContext = InterfaceContext & {
  permission: Permission;
  readonly siteOrigin: string;
  readonly balance: Hex;
  expiry: number;

  /**
   * The delegation data with attached caveat specific to the permission.
   */
  delegation: {
    readonly delegate: Hex; // The dapp session account(ie. account to receive the delegation).
    readonly delegator: Hex; // The user account(ie. account to sign the delegation).
    caveats: any[];
    salt: Hex;
    authority: Hex;
    signature: Hex;
  };
};

export type PermissionConfirmationProps = JsonObject &
  Pick<
    PermissionConfirmationContext,
    'permission' | 'siteOrigin' | 'balance' | 'expiry' | 'delegation'
  >;

export const PERMISSION_CONF_CANCEL_BUTTON = 'cancel';
export const PERMISSION_CONF_GRANT_BUTTON = 'grant';

export const PermissionConfirmationPage: SnapComponent<
  PermissionConfirmationProps
> = ({ siteOrigin, permission }) => {
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
        <Button name={PERMISSION_CONF_CANCEL_BUTTON} variant="destructive">
          Cancel
        </Button>
        <Button name={PERMISSION_CONF_GRANT_BUTTON} variant="primary">
          Grant
        </Button>
      </Footer>
    </Container>
  );
};
