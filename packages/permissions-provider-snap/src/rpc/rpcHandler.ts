import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json, SnapsProvider } from '@metamask/snaps-sdk';

import type { AccountControllerInterface } from '../accountController';
import type { GrantPermissionContext } from '../ui/grant-permission';
import { GrantPermissonPage } from '../ui/grant-permission';

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
 * @param config.snapsProvider - The snaps provider.
 * @returns An object with RPC handler methods.
 */
export function createRpcHandler(config: {
  accountController: AccountControllerInterface;
  snapsProvider: SnapsProvider;
}): RpcHandler {
  const { accountController, snapsProvider } = config;

  return {
    /**
     * Handles grant permission requests.
     *
     * @param params - The parameters for the grant permission request.
     * @returns The result of the grant permission request.
     */
    async grantPermission(params?: Json): Promise<Json> {
      // todo: the vast majority of this code should be removed, and replaced
      // with a call into the orchestrator factory.

      logger.debug('grantPermissions()', params);

      const { permissionsRequest, siteOrigin } = params as unknown as any;

      const firstRequest = permissionsRequest[0];
      if (!firstRequest) {
        throw new Error('No permission request found');
      }

      const context: GrantPermissionContext = {
        siteOrigin,
        permissionRequest: firstRequest,
      };

      const chainId = Number(firstRequest.chainId);

      const accountAddress = await accountController.getAccountAddress({
        chainId,
      });

      const didUserGrantPermission = await snapsProvider.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: GrantPermissonPage({
            siteOrigin: context.siteOrigin,
            permission: context.permissionRequest.permission,
            accountAddress,
            chainId,
          }),
        },
      });

      logger.debug('isPermissionGranted', didUserGrantPermission);

      // just a placeholder for now
      return (
        didUserGrantPermission ? context : { isPermissionGranted: false }
      ) as Json;
    },
  };
}
