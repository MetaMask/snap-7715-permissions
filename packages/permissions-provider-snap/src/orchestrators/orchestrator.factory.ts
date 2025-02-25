import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type { SnapsProvider } from '@metamask/snaps-sdk';

import {
  createNativeTokenStreamPermissionOrchestrator,
  createNativeTokenTransferPermissionOrchestrator,
} from './native-token-orchestrators';
import type {
  SupportedPermissionTypes,
  PermissionOrchestratorReturnMapping,
} from './orchestrator.types';

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
  PermissionType extends SupportedPermissionTypes,
>(
  permissionRequest: PermissionRequest,
  snapsProvider: SnapsProvider,
  accountController: unknown,
): PermissionOrchestratorReturnMapping[PermissionType] => {
  const permissionType = extractPermissionName(
    permissionRequest.permission.type,
  );

  const orchestrators: Record<
    string,
    PermissionOrchestratorReturnMapping[PermissionType]
  > = {
    'native-token-transfer': createNativeTokenTransferPermissionOrchestrator(
      snapsProvider,
      accountController,
    ) as PermissionOrchestratorReturnMapping[PermissionType],
    'native-token-stream': createNativeTokenStreamPermissionOrchestrator(
      snapsProvider,
      accountController,
    ) as PermissionOrchestratorReturnMapping[PermissionType],
  };

  const orchestrator = orchestrators[permissionType];
  if (!orchestrator) {
    throw new Error('Permission type is not supported');
  }
  return orchestrator;
};
