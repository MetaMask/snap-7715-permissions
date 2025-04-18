import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';

import type { BaseOrchestrator } from './baseOrchestrator';
import { NativeTokenStreamOrchestrator } from './nativeTokenStream';
import type {
  OrchestratorDependencies,
  SupportedPermissionTypes,
} from './types';

/**
 * Factory function for creating a permission orchestrator for a given permission type.
 *
 * @param orchestratorDependencies - The dependencies for the orchestrator.
 * @param permissionRequest - The permission request.
 * @param origin - The origin of the permission request.
 * @returns A permission orchestrator for the given permission type.
 * @throws If the permission type is not supported.
 */
export const createPermissionOrchestrator = (
  orchestratorDependencies: OrchestratorDependencies,
  permissionRequest: PermissionRequest,
  origin: string,
): BaseOrchestrator<SupportedPermissionTypes> => {
  const type = extractPermissionName(
    permissionRequest.permission.type,
  ) as SupportedPermissionTypes;

  switch (type) {
    case 'native-token-stream':
      return new NativeTokenStreamOrchestrator(
        orchestratorDependencies,
        permissionRequest,
        origin,
      );
    default:
      throw new Error(`Unknown permission type: ${type as string}`);
  }
};
