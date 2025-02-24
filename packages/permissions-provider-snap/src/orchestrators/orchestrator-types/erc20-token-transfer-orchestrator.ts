import type {
  Erc20PermissionTypePermissionOrchestrator,
  Erc20TokenTransferPermissionRequest,
  PermissionRequest,
} from '@metamask/7715-permissions-shared/types';
import type { SnapsProvider } from '@metamask/snaps-sdk';

/**
 * Factory function for create a native token transfer permission orchestrator.
 *
 * @param _snapsProvider - A snaps provider instance.
 * @param _accountController - An account controller instance.
 * @returns A permission orchestrator for the erc-20-token-transfer permission type.
 */
export const createErc20PermissionTypePermissionOrchestrator = (
  _snapsProvider: SnapsProvider,
  _accountController: unknown,
): Erc20PermissionTypePermissionOrchestrator => {
  return {
    permissionType: 'erc-20-token-transfer',
    validate: async (_basePermissionRequest: PermissionRequest) => {
      // TODO: Implement Specific permission validator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/38
      return true;
    },
    orchestrate: async (
      _erc20TokenTransferPermissionRequest: Erc20TokenTransferPermissionRequest,
    ) => {
      // TODO: Implement Specific permission orchestrator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/42
      return null;
    },
  };
};
