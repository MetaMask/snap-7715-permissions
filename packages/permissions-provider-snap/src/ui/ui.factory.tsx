import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type { ComponentOrElement } from '@metamask/snaps-sdk';
// import { Box, Text } from '@metamask/snaps-sdk/jsx';

import type { SupportedPermissionTypes } from '../orchestrators';
import { NativeTokenStreamConfirmationPage } from './confirmations';
import type {
  PermissionConfirmationContext,
  PreparePermissionConfirmationMeta,
} from './ui.types';

/**
 * Factory function for creating a permission confirmation page for a specific permission type.
 * @param preparePermissionConfirmationMeta - The meta data required to prepare the permission confirmation page.
 * @returns The permission confirmation context and the permission confirmation page component for the specific permission type.
 */
export const permissionConfirmationPageFactory = <
  TPermissionType extends SupportedPermissionTypes,
>(
  preparePermissionConfirmationMeta: PreparePermissionConfirmationMeta<TPermissionType>,
): [PermissionConfirmationContext<TPermissionType>, ComponentOrElement] => {
  const { permission, delegator, delegate, siteOrigin, balance, expiry } =
    preparePermissionConfirmationMeta;

  const permissionType = extractPermissionName(permission.type);
  const context: PermissionConfirmationContext<TPermissionType> = {
    permission,
    siteOrigin,
    balance,
    expiry,
    delegation: {
      delegator,
      delegate,
      caveats: [],
      salt: '0x1',
      authority: '0x000000_authority',
      signature: '0x',
    },
  };

  const confirmationScreens: Record<string, ComponentOrElement> = {
    'native-token-stream': (
      <NativeTokenStreamConfirmationPage
        siteOrigin={context.siteOrigin}
        permission={context.permission}
        balance={context.balance}
        expiry={context.expiry}
        delegation={context.delegation}
      />

      // TODO: Box renders fine, figure out why components are not rendering with error
      // <Box>
      //   <Text>Happy path</Text>
      // </Box>
    ),
  };

  const confirmationScreen = confirmationScreens[permissionType];
  if (!confirmationScreen) {
    throw new Error('Permission confirmation screen not found');
  }
  return [context, confirmationScreen];
};
