import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import type { SnapsProvider } from '@metamask/snaps-sdk';

import type {
  OrchestrateMeta,
  Orchestrator,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from './orchestrator.types';

/**
 * Factory function for create a permission orchestrator for a specific permission type.
 *
 * @param _snapsProvider - A snaps provider instance.
 * @param _accountController - An account controller instance.
 * @returns A permission orchestrator for the native-token-stream permission type.
 */
export const createPermissionOrchestrator = <
  TPermissionType extends SupportedPermissionTypes,
>(
  _snapsProvider: SnapsProvider,
  _accountController: unknown,
): Orchestrator<TPermissionType> => {
  let passedValidation = false;
  return {
    validate: async (_basePermissionRequest: PermissionRequest) => {
      // TODO: Implement Specific permission validator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/38
      passedValidation = true;
      return true;
    },
    orchestrate: async (
      _permission: PermissionTypeMapping[TPermissionType],
      _orchestrateMeta: OrchestrateMeta,
    ) => {
      if (!passedValidation) {
        throw new Error(
          'Permission has not been validated, call validate before orchestrate',
        );
      }

      // TODO: Implement Specific permission orchestrator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/42
      return null;
    },
  };
};
