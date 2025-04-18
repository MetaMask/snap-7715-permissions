import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json } from '@metamask/snaps-sdk';

import type { OrchestratorDependencies } from '../../permissions';
import { createPermissionOrchestrator } from '../../permissions';
import { validatePermissionRequestParam } from '../../utils';

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
 * @param orchestratorDependencies - The dependencies for the orchestrator.
 * @returns An object with RPC handler methods.
 */
export function createRpcHandler(
  orchestratorDependencies: OrchestratorDependencies,
): RpcHandler {
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

      // create orchestrator
      const orchestrator = createPermissionOrchestrator(
        orchestratorDependencies,
        firstRequest,
        siteOrigin,
      );

      // process the request
      const orchestrateRes = await orchestrator.orchestrate();
      logger.debug('isPermissionGranted', orchestrateRes.success);

      if (!orchestrateRes.success) {
        throw new Error(orchestrateRes.reason);
      }

      return [orchestrateRes.response] as Json[];
    },
  };
}
