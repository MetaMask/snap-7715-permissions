import { GATOR_PERMISSIONS_PROVIDER_SNAP_ID } from '@metamask/7715-permissions-shared/constants';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json, SnapsProvider } from '@metamask/snaps-sdk';

import type { PermissionOfferRegistryManager } from '../registryManager';
import {
  parsePermissionRequestParam,
  parsePermissionsResponseParam,
} from '../utils';
import { ExternalMethod } from './rpcMethod';

/**
 * Type for the RPC handler methods.
 */
export type RpcHandler = {
  /**
   * Handles grant permission requests.
   *
   * @param options - The configuration for the grant permission request.
   * @param options.siteOrigin - The origin of the site requesting the permissions.
   * @param options.params - The parameters for the grant permission request.
   * @returns The result of the grant permission request.
   */
  grantPermissions(options: {
    siteOrigin: string;
    params?: Json;
  }): Promise<Json>;
};

/**
 * Creates an RPC handler with methods for handling permission-related RPC requests.
 *
 * @param config - The parameters for creating the RPC handler.
 * @param config.permissionOfferRegistryManager - The manager for the permission offer registry.
 * @param config.snapsProvider - The snaps provider.
 * @returns An object with RPC handler methods.
 */
export function createRpcHandler(config: {
  permissionOfferRegistryManager: PermissionOfferRegistryManager;
  snapsProvider: SnapsProvider;
}): RpcHandler {
  const { permissionOfferRegistryManager, snapsProvider } = config;

  /**
   * Handles grant permission requests.
   *
   * @param options - The configuration for the grant permission request.
   * @param options.siteOrigin - The origin of the site requesting the permissions.
   * @param options.params - The parameters for the grant permission request.
   * @returns The result of the grant permission request.
   */
  const grantPermissions = async (options: {
    siteOrigin: string;
    params?: Json;
  }): Promise<Json> => {
    logger.debug({ options }, 'grantPermissions()');
    const parsedPermissionsRequest = parsePermissionRequestParam(
      options.params,
    );

    // We only want gator-permissions-snap for now but we will use more snaps in the future
    const permissionOfferRegistry =
      await permissionOfferRegistryManager.buildPermissionOffersRegistry(
        GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
      );

    // Find the relevant permissions to grant by filtering against the registered offers
    const { permissionsToGrant, errorMessage } =
      permissionOfferRegistryManager.findRelevantPermissionsToGrant({
        allRegisteredOffers:
          permissionOfferRegistryManager.getRegisteredPermissionOffers(
            permissionOfferRegistry,
          ),
        permissionsToGrant: parsedPermissionsRequest,
      });

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    const grantedPermissions = await snapsProvider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID, // We only want gator-permissions-snap for now but we will use more snaps in the future
        request: {
          method: ExternalMethod.PermissionProviderGrantPermissions,
          params: {
            permissionsRequest: permissionsToGrant,
            siteOrigin: options.siteOrigin,
          } as Json,
        },
      },
    });

    return parsePermissionsResponseParam(grantedPermissions) as Json;
  };

  return {
    grantPermissions,
  };
}
