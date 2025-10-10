import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import { UserRejectedRequestError, type Json } from '@metamask/snaps-sdk';

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

    const permissionsToStore: {
      permissionResponse: PermissionResponse;
      siteOrigin: string;
    }[] = [];

    // First, process all permissions to collect responses and validate all are approved
    for (const request of permissionsRequest) {
      const handler = permissionHandlerFactory.createPermissionHandler(request);

      const permissionResponse =
        await handler.handlePermissionRequest(siteOrigin);

      if (!permissionResponse.approved) {
        throw new UserRejectedRequestError(permissionResponse.reason);
      }

      permissionsToStore.push({
        permissionResponse: permissionResponse.response,
        siteOrigin,
      });
    }

    // Only after all permissions have been successfully processed, store them all in batch
    if (permissionsToStore.length > 0) {
      await profileSyncManager.storeGrantedPermissionBatch(permissionsToStore);
    }

    // Return the permission responses
    return permissionsToStore.map(
      (permission) => permission.permissionResponse as Json,
    );
  };

  /**
   * Handles get permission offers requests.
   *
   * @returns The permission offers.
   */
  const getPermissionOffers = async (): Promise<Json> => {
    logger.debug('getPermissionOffers()');
    return DEFAULT_GATOR_PERMISSION_TO_OFFER as Json[];
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
