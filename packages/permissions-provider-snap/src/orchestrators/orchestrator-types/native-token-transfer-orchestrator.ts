import type {
  Permission,
  NativeTokenTransferPermission,
  NativePermissionTypePermissionOrchestrator,
} from '@metamask/7715-permissions-shared/types';
import type { SnapsProvider } from '@metamask/snaps-sdk';

/**
 * Factory function for create a ERC20 token transfer permission orchestrator.
 *
 * @param _snapsProvider - A snaps provider instance.
 * @param _accountController - An account controller instance.
 * @returns A permission orchestrator for the native-token-transfer permission type.
 */
export const createNativePermissionTypePermissionOrchestrator = (
  _snapsProvider: SnapsProvider,
  _accountController: unknown,
): NativePermissionTypePermissionOrchestrator => {
  return {
    permissionType: 'native-token-transfer',
    validate: (_permission: Permission) => {
      // TODO: Implement Specific permission validator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/38
      return true;
    },
    orchestrate: async (
      _nativeTokenTransferPermission: NativeTokenTransferPermission,
    ) => {
      // TODO: Implement Specific permission orchestrator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/42
      return null;
    },
  };
};
