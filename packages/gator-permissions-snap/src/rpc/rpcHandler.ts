import { logger } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError, type Json } from '@metamask/snaps-sdk';

import type { PermissionHandlerFactory } from '../core/permissionHandlerFactory';
import { DEFAULT_GATOR_PERMISSION_TO_OFFER } from '../permissions/permissionOffers';
import type { ProfileSyncManager } from '../profileSync';
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

  /**
   * Handles get permission offers requests.
   *
   * @returns The permission offers.
   */
  getPermissionOffers(): Promise<Json>;

  /**
   * Handles get granted permissions requests.
   *
   * @returns The granted permissions.
   */
  getGrantedPermissions(): Promise<Json>;
};

/**
 * Creates an RPC handler with methods for handling permission-related RPC requests.
 *
 * @param config - The parameters for creating the RPC handler.
 * @param config.permissionHandlerFactory - The factory for creating permission handlers.
 * @param config.profileSyncManager - The profile sync manager.
 * @returns An object with RPC handler methods.
 */
export function createRpcHandler(config: {
  permissionHandlerFactory: PermissionHandlerFactory;
  profileSyncManager: ProfileSyncManager;
}): RpcHandler {
  const { permissionHandlerFactory, profileSyncManager } = config;

  /**
   * Handles grant permission requests.
   *
   * @param params - The parameters for the grant permission request.
   * @returns The result of the grant permission request.
   */
  const grantPermission = async (params?: Json): Promise<Json> => {
    logger.debug('grantPermissions()', params);
    const { permissionsRequest, siteOrigin } =
      validatePermissionRequestParam(params);

    const responses = await Promise.all(
      permissionsRequest.map(async (request) => {
        const handler =
          permissionHandlerFactory.createPermissionHandler(request);

        const permissionResponse =
          await handler.handlePermissionRequest(siteOrigin);

        if (!permissionResponse.approved) {
          throw new InvalidInputError(permissionResponse.reason);
        }

        if (permissionResponse.response) {
          await profileSyncManager.storeGrantedPermission({
            permissionResponse: permissionResponse.response,
            siteOrigin,
          });
        }

        return permissionResponse.response;
      }),
    );

    return responses as Json[];
  };

  /**
   * Handles get permission offers requests.
   *
   * @returns The permission offers.
   */
  const getPermissionOffers = async (): Promise<Json> => {
    logger.debug('getPermissionOffers()');
    return DEFAULT_GATOR_PERMISSION_TO_OFFER;
  };

  /**
   * Handles get granted permissions requests.
   *
   * @returns The granted permissions.
   */
  const getGrantedPermissions = async (): Promise<Json> => {
    logger.debug('getGrantedPermissions()');
    const grantedPermission =
      await profileSyncManager.getAllGrantedPermissions();
    return grantedPermission as Json[];
  };

  return {
    grantPermission,
    getPermissionOffers,
    getGrantedPermissions,
  };
}
