import { createRootDelegation } from '@metamask-private/delegator-core-viem';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type { ComponentOrElement } from '@metamask/snaps-sdk';

import type {
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../orchestrators';
import { convertToDelegationInTransit } from '../utils';
import { NativeTokenStreamConfirmationPage } from './confirmations';
import type {
  PermissionConfirmationContext,
  PermissionConfirmationMeta,
} from './types';

/**
 * Factory function for creating a permission confirmation page for a specific permission type.
 * @param permissionConfirmationMeta - The meta data required to prepare the permission confirmation page.
 * @returns The permission confirmation context and the permission confirmation page component for the specific permission type.
 */
export const permissionConfirmationPageFactory = <
  TPermissionType extends SupportedPermissionTypes,
>(
  permissionConfirmationMeta: PermissionConfirmationMeta<TPermissionType>,
): [PermissionConfirmationContext<TPermissionType>, ComponentOrElement] => {
  const {
    permission,
    delegator,
    delegate,
    siteOrigin,
    balance,
    expiry,
    chainId,
  } = permissionConfirmationMeta;

  const permissionType = extractPermissionName(permission.type);
  const context: PermissionConfirmationContext<TPermissionType> = {
    permission,
    siteOrigin,
    balance,
    expiry,
    chainId,
    // TODO: Use the delegation builder to attach the correct caveats specific to the permission type: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/41
    delegation: convertToDelegationInTransit(
      createRootDelegation(delegate, delegator, []),
    ),
  };

  const confirmationScreens: Record<string, ComponentOrElement> = {
    'native-token-stream': (
      <NativeTokenStreamConfirmationPage
        siteOrigin={context.siteOrigin}
        permission={
          context.permission as PermissionTypeMapping['native-token-stream']
        }
        balance={context.balance}
        expiry={context.expiry}
        chainId={context.chainId}
        delegation={context.delegation}
      />
    ),
  };

  const confirmationScreen = confirmationScreens[permissionType];
  if (!confirmationScreen) {
    throw new Error('Permission confirmation screen not found');
  }
  return [context, confirmationScreen];
};
