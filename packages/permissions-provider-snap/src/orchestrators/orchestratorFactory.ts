import type { PermissionConfirmationRenderHandler } from 'src/ui';

import type { MockAccountController } from '../accountController.mock';
import { createNativeTokenStreamPermissionOrchestrator } from './nativeTokenStreamOrchestrators';
import type { Orchestrator, SupportedPermissionTypes } from './types';

/**
 * Factory function for creating a permission orchestrator for a given permission type.
 *
 * @param permissionType - The permission type.
 * @param accountController - An account controller instance.
 * @param permissionConfirmationRenderHandler - The permission confirmation render handler.
 * @returns A permission orchestrator for the given permission type.
 * @throws If the permission type is not supported.
 */
export const createPermissionOrchestratorFactory = <
  TPermissionType extends SupportedPermissionTypes,
>(
  permissionType: TPermissionType,
  accountController: MockAccountController,
  permissionConfirmationRenderHandler: PermissionConfirmationRenderHandler,
): Orchestrator<TPermissionType> => {
  if (permissionType === 'native-token-stream') {
    return createNativeTokenStreamPermissionOrchestrator(
      accountController,
      permissionConfirmationRenderHandler,
    ) as unknown as Orchestrator<typeof permissionType>;
  }

  throw new Error('Permission type is not supported');
};
