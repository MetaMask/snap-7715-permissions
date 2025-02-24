import type {
  PermissionRequest,
  PermissionOrchestratorKeys,
  PermissionOrchestratorTypeMapping,
} from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type { SnapsProvider } from '@metamask/snaps-sdk';

import {
  createErc20PermissionTypePermissionOrchestrator,
  createNativePermissionTypePermissionOrchestrator,
} from './orchestrator-types';

/**
 * Factory function for creating a permission orchestrator for a given permission type.
 *
 * @param permissionRequest - A valid permission request.
 * @param snapsProvider - A snaps provider instance.
 * @param accountController - An account controller instance.
 * @returns A permission orchestrator for the given permission type.
 * @throws If the permission type is not supported.
 */
export const createPermissionOrchestratorFactory = <
  PermissionType extends PermissionOrchestratorKeys,
>(
  permissionRequest: PermissionRequest,
  snapsProvider: SnapsProvider,
  accountController: unknown,
): PermissionOrchestratorTypeMapping[PermissionType]['return'] => {
  const permissionType = extractPermissionName(
    permissionRequest.permission.type,
  );

  if (permissionType === 'erc-20-token-transfer') {
    return createErc20PermissionTypePermissionOrchestrator(
      snapsProvider,
      accountController,
    );
  }

  if (permissionType === 'native-token-transfer') {
    return createNativePermissionTypePermissionOrchestrator(
      snapsProvider,
      accountController,
    );
  }
  throw new Error('Permission type is not supported');
};
