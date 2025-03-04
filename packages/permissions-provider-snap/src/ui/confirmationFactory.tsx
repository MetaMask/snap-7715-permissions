import { createRootDelegation } from '@metamask-private/delegator-core-viem';
import type { ComponentOrElement } from '@metamask/snaps-sdk';

import type { PermissionCaseHandler } from '../orchestrators';
import {
  type PermissionTypeMapping,
  type SupportedPermissionTypes,
} from '../orchestrators';
import { convertToDelegationInTransit, handlePermissionCase } from '../utils';
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

  const caseHandlers: PermissionCaseHandler<
    TPermissionType,
    ComponentOrElement
  > = {
    'native-token-stream': (per) => (
      <NativeTokenStreamConfirmationPage
        siteOrigin={context.siteOrigin}
        permission={per as PermissionTypeMapping['native-token-stream']}
        balance={context.balance}
        expiry={context.expiry}
        chainId={context.chainId}
        delegation={context.delegation}
      />
    ),
    'native-token-transfer': (_per) => {
      throw new Error('Permission confirmation screen not found');
    },
  };

  const confirmationScreen = handlePermissionCase(
    permission,
    caseHandlers,
    'Permission confirmation screen not found',
  );

  return [context, confirmationScreen];
};
