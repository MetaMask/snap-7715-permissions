import {
  createRootDelegation,
  encodeDelegation,
} from '@metamask-private/delegator-core-viem';
import type { NativeTokenStreamPermission } from '@metamask/7715-permissions-shared/types';
import { type Permission } from '@metamask/7715-permissions-shared/types';
import type { Hex } from 'viem';

import type { PermissionConfirmationContext } from '../../ui';
import { NativeTokenStreamConfirmationPage } from '../../ui/confirmations';
import type { OrchestratorArgs, OrchestratorFactoryFunction } from '../types';
import { type PermissionTypeMapping } from '../types';
import { parsePermission } from '../validate';

/**
 * Validates a permission object data specific to the permission type.
 *
 * @param _permission - The permission object.
 * @returns True if the permission object data is valid.
 * @throws An error if the permission object data is invalid.
 */
const validatePermissionData = (
  _permission: NativeTokenStreamPermission,
): true => {
  // TODO: Implement permission.data validation for the native-token-stream permission type
  return true;
};

/**
 * Factory function to create a permission orchestrator for a native-token-stream permission type.
 *
 * @param args - The orchestrator arguments.
 * @returns A permission orchestrator for the native-token-stream permission type.
 */
export const nativeTokenStreamPermissionOrchestrator: OrchestratorFactoryFunction<
  'native-token-stream'
> = (args: OrchestratorArgs) => {
  const { accountController } = args;

  return {
    parseAndValidate: async (basePermission: Permission) => {
      const validatedPermission = parsePermission(
        basePermission,
        'native-token-stream',
      );
      validatePermissionData(validatedPermission);

      return validatedPermission;
    },
    buildPermissionConfirmationPage: (
      context: PermissionConfirmationContext<'native-token-stream'>,
    ) => {
      return (
        <NativeTokenStreamConfirmationPage
          siteOrigin={context.siteOrigin}
          account={context.account}
          permission={context.permission}
          balance={context.balance}
          expiry={context.expiry}
          chainId={context.chainId}
        />
      );
    },
    buildPermissionContext: async (
      account: Hex,
      sessionAccount: Hex,
      chainId: number,
      _attenuatedPermission: PermissionTypeMapping['native-token-stream'],
    ) => {
      // TODO: Use the delegation builder to attach the correct caveats specific to the permission type
      // https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/41
      const delegation = createRootDelegation(sessionAccount, account, []);

      // Sign the delegation and encode it to create the permissioncContext
      const signedDelegation = await accountController.signDelegation({
        chainId,
        delegation,
      });
      const permissionContext = encodeDelegation([signedDelegation]);
      return permissionContext;
    },
  };
};
