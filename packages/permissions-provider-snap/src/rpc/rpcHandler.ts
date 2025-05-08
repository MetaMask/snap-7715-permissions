import {
  extractPermissionName,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import type { Json } from '@metamask/snaps-sdk';

import type { AccountControllerInterface } from '../accountController';
import type {
  OrchestrateArgs,
  PermissionsContextBuilder,
} from '../orchestrators';
import {
  createPermissionOrchestrator,
  orchestrate,
  type SupportedPermissionTypes,
} from '../orchestrators';
import type { ProfileSyncManager } from '../profileSync';
import type { TokenPricesService } from '../services';
import type { PermissionConfirmationRenderHandler } from '../ui';
import type { UserEventDispatcher } from '../userEventDispatcher';
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
 * @param config.permissionsContextBuilder - The permissions context builder.
 * @param config.tokenPricesService - The token prices service.
 * @param config.userEventDispatcher - The user event dispatcher.
 * @param config.profileSyncManager - The profile sync manager.
 * @returns An object with RPC handler methods.
 */
export function createRpcHandler(config: {
  accountController: AccountControllerInterface;
  permissionConfirmationRenderHandler: PermissionConfirmationRenderHandler;
  permissionsContextBuilder: PermissionsContextBuilder;
  tokenPricesService: TokenPricesService;
  userEventDispatcher: UserEventDispatcher;
  profileSyncManager: ProfileSyncManager;
}): RpcHandler {
  const {
    permissionConfirmationRenderHandler,
    accountController,
    permissionsContextBuilder,
    tokenPricesService,
    userEventDispatcher,
    profileSyncManager,
  } = config;

  return {
    /**
     * Handles grant permission requests.
     *
     * @param params - The parameters for the grant permission request.
     * @returns The result of the grant permission request.
     */
    async grantPermission(params?: Json): Promise<Json> {
      logger.debug('grantPermissions()', params);
      console.log('Granting permissions', JSON.stringify(params));
      const { permissionsRequest, siteOrigin } =
        validatePermissionRequestParam(params);

      const firstRequest = permissionsRequest[0];
      if (!firstRequest) {
        throw new Error('No permission request found');
      }

      const permissionType = extractPermissionName(
        firstRequest.permission.type,
      ) as SupportedPermissionTypes;

      // create orchestrator and get user profile
      const orchestrator = createPermissionOrchestrator(permissionType);
      const permission = await orchestrator.parseAndValidate(
        firstRequest.permission,
      );

      // process the request
      const orchestrateArgs: OrchestrateArgs<typeof permissionType> = {
        permissionType,
        accountController,
        orchestrator,
        orchestrateMeta: {
          permission,
          chainId: firstRequest.chainId,
          sessionAccount: firstRequest.signer.data.address,
          origin: siteOrigin,
          expiry: firstRequest.expiry,
          isAdjustmentAllowed: firstRequest.isAdjustmentAllowed ?? true,
        },
        permissionConfirmationRenderHandler,
        permissionsContextBuilder,
        tokenPricesService,
        userEventDispatcher,
      };
      const orchestrateRes = await orchestrate(orchestrateArgs);
      logger.debug('isPermissionGranted', orchestrateRes.success);

      if (!orchestrateRes.success) {
        throw new Error(orchestrateRes.reason);
      }

      // Store the granted permission with profile sync
      // Feature flag to only enable for local development until
      // message-signing-snap v1.1.2 released in MM 12.18: https://github.com/MetaMask/metamask-extension/pull/32521
      // eslint-disable-next-line no-restricted-globals
      if (process.env.SNAP_ENV === 'local') {
        const userProfile = await profileSyncManager.getUserProfile();
        if (!userProfile) {
          throw new Error('Failed to get user profile');
        }

        await profileSyncManager.storeGrantedPermission({
          permissionResponse: orchestrateRes.response,
          siteOrigin,
        });
      }

      return [orchestrateRes.response] as Json[];
    },
  };
}
