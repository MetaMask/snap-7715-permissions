import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json } from '@metamask/snaps-sdk';

import type { OrchestratorFactory } from '../core/orchestratorFactory';
import { validatePermissionRequestParam } from '../utils/validate';

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
 * @param config.orchestratorFactory - The factory for creating permission orchestrators.
 * @returns An object with RPC handler methods.
 */
export function createRpcHandler(config: {
  orchestratorFactory: OrchestratorFactory;
}): RpcHandler {
  const { orchestratorFactory } = config;

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

      const responses = await Promise.all(
        permissionsRequest.map(async (request) => {
          // todo: we probably need to pass siteOrigin to display it
          const orchestrator = orchestratorFactory.createOrchestrator(request);

          const permissionResponse = await orchestrator.orchestrate();

          if (!permissionResponse.success) {
            throw new Error(permissionResponse.reason);
          }

          return permissionResponse.response;
        }),
      );

      // todo: type this better
      const filtered = responses.filter((response) => response !== undefined);

      return filtered as Json[];
    },
  };
}
