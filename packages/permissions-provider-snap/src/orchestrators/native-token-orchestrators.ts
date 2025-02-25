import type {
  NativeTokenStreamPermission,
  NativeTokenTransferPermission,
  PermissionRequest,
} from '@metamask/7715-permissions-shared/types';
import type { SnapsProvider } from '@metamask/snaps-sdk';

import type { OrchestrateMeta, Orchestrator } from './orchestrator.types';

/**
 * Factory function for create a native token transfer permission orchestrator.
 *
 * @param _snapsProvider - A snaps provider instance.
 * @param _accountController - An account controller instance.
 * @returns A permission orchestrator for the native-token-transfer permission type.
 */
export const createNativeTokenTransferPermissionOrchestrator = (
  _snapsProvider: SnapsProvider,
  _accountController: unknown,
): Orchestrator<'native-token-transfer'> => {
  return {
    permissionType: 'native-token-transfer',
    validate: async (_basePermissionRequest: PermissionRequest) => {
      // TODO: Implement Specific permission validator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/38
      return true;
    },
    orchestrate: async (
      _nativeTokenTransferPermission: NativeTokenTransferPermission,
      _orchestrateMeta: OrchestrateMeta,
    ) => {
      // TODO: Implement Specific permission orchestrator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/42
      return null;
    },
  };
};

/**
 * Factory function for create a native token stream permission orchestrator.
 *
 * @param _snapsProvider - A snaps provider instance.
 * @param _accountController - An account controller instance.
 * @returns A permission orchestrator for the native-token-stream permission type.
 */
export const createNativeTokenStreamPermissionOrchestrator = (
  _snapsProvider: SnapsProvider,
  _accountController: unknown,
): Orchestrator<'native-token-stream'> => {
  return {
    permissionType: 'native-token-stream',
    validate: async (_basePermissionRequest: PermissionRequest) => {
      // TODO: Implement Specific permission validator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/38
      return true;
    },
    orchestrate: async (
      _nativeTokenStreamPermission: NativeTokenStreamPermission,
      _orchestrateMeta: OrchestrateMeta,
    ) => {
      // TODO: Implement Specific permission orchestrator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/42
      return null;
    },
  };
};
