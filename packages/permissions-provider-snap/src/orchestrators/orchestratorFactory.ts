import type { SupportedPermissionTypes } from './orchestrator';
import { orchestratorModules } from './orchestrator';
import type { Orchestrator } from './types';

/**
 * Factory function for creating a permission orchestrator for a given permission type.
 *
 * @param permissionType - The permission type.
 * @returns A permission orchestrator for the given permission type.
 * @throws If the permission type is not supported.
 */
export const createPermissionOrchestrator = <
  TPermissionType extends SupportedPermissionTypes,
>(
  permissionType: TPermissionType,
): Orchestrator<TPermissionType> => {
  const module = orchestratorModules[permissionType];
  if (!module) {
    throw new Error('Permission type is not supported');
  }
  return module(permissionType)();
};
