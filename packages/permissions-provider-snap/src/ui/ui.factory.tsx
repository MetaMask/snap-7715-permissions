import { createRootDelegation } from '@metamask-private/delegator-core-viem';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type { ComponentOrElement } from '@metamask/snaps-sdk';

import type { SupportedPermissionTypes } from '../orchestrators';
import { convertToDelegationInTransit } from '../utils';
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
  const {
    permission,
    delegator,
    delegate,
    siteOrigin,
    balance,
    expiry,
    chainId,
  } = preparePermissionConfirmationMeta;

  const permissionType = extractPermissionName(permission.type);
  const context: PermissionConfirmationContext<TPermissionType> = {
    permission,
    siteOrigin,
    balance,
    expiry,
    chainId,
    delegation: convertToDelegationInTransit(
      createRootDelegation(delegate, delegator, []),
    ),
  };

  const confirmationScreens: Record<string, ComponentOrElement> = {
    'native-token-stream': (
      <NativeTokenStreamConfirmationPage
        siteOrigin={context.siteOrigin}
        permission={context.permission}
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
