import {
  extractPermissionName,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import type { Json } from '@metamask/snaps-sdk';

import type { AccountControllerInterface } from '../accountController';
import { createMockAccountController } from '../accountController.mock';
import {
  createPermissionOrchestrator,
  orchestrate,
  type SupportedPermissionTypes,
} from '../orchestrators';
import type { PermissionConfirmationRenderHandler } from '../ui';
import { validatePermissionRequestParam } from '../utils';

/**
 * Type for the RPC handler methods.
 */
export type RpcHandler = {
  /**
   * Handles grant permission requests.
   *
   * @param params - The parameters for the grant permission request.
   * @returns The result of the grant permission request.
   */
  grantPermission(params?: Json): Promise<Json>;
};

/**
 * Creates an RPC handler with methods for handling permission-related RPC requests.
 *
 * @param config - The parameters for creating the RPC handler.
 * @param config.accountController - The account controller interface.
 * @param config.permissionConfirmationRenderHandler - The permission confirmation render handler.
 * @returns An object with RPC handler methods.
 */
export function createRpcHandler(config: {
  accountController: AccountControllerInterface;
  permissionConfirmationRenderHandler: PermissionConfirmationRenderHandler;
}): RpcHandler {
  const { permissionConfirmationRenderHandler } = config;
  const mockAccountController = createMockAccountController();

  return {
    /**
     * Handles grant permission requests.
     *
     * @param params - The parameters for the grant permission request.
     * @returns The result of the grant permission request.
     */
    async grantPermission(params?: Json): Promise<Json> {
      logger.debug('grantPermissions()', params);

      const { permissionsRequest, siteOrigin } =
        validatePermissionRequestParam(params);

      const firstRequest = permissionsRequest[0];
      if (!firstRequest) {
        throw new Error('No permission request found');
      }

      // TODO: Only supporting one permission per request for now, but this will be updated in the future
      const firstPermission = firstRequest.permissions[0];
      if (!firstPermission) {
        throw new Error('No permission found');
      }

      const permissionType = extractPermissionName(
        firstPermission.type,
      ) as SupportedPermissionTypes;

      // create orchestrator
      const orchestrator = createPermissionOrchestrator(permissionType, {
        accountController: mockAccountController,
      });
      const permission = await orchestrator.parseAndValidate(firstPermission);

      // process the request
      const orchestrateRes = await orchestrate({
        permissionType,
        accountController: mockAccountController,
        orchestrator,
        orchestrateMeta: {
          permission,
          chainId: firstRequest.chainId,
          sessionAccount: firstRequest.signer.data.address,
          origin: siteOrigin,
          expiry: firstRequest.expiry,
        },
        permissionConfirmationRenderHandler,
      });
      logger.debug('isPermissionGranted', orchestrateRes.success);

      if (!orchestrateRes.success) {
        throw new Error(orchestrateRes.reason);
      }

      return [orchestrateRes.response] as Json[];
    },
  };
}
