import { GATOR_PERMISSIONS_PROVIDER_SNAP_ID } from '@metamask/7715-permissions-shared/constants';
import type { PermissionsRequest } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json, SnapsProvider } from '@metamask/snaps-sdk';

import type { PermissionOfferRegistryManger } from '../registryManger';
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
 * @param config.permissionOfferRegistryManger - The manager for the permission offer registry.
 * @param config.snapsProvider - The snaps provider.
 * @returns An object with RPC handler methods.
 */
export function createRpcHandler(config: {
  permissionOfferRegistryManger: PermissionOfferRegistryManger;
  snapsProvider: SnapsProvider;
}): RpcHandler {
  const { permissionOfferRegistryManger, snapsProvider } = config;

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
      await permissionOfferRegistryManger.buildPermissionOffersRegistry(
        GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
      );

    // Find the relevant permissions to grant by filtering against the registered offers
    const relevantPermissionsRequestToGrant: PermissionsRequest =
      permissionOfferRegistryManger.findRelevantPermissionsToGrant(
        permissionOfferRegistryManger.getRegisteredPermissionOffers(
          permissionOfferRegistry,
        ),
        parsedPermissionsRequest,
      );

    if (relevantPermissionsRequestToGrant.length === 0) {
      throw new Error('No relevant permissions to grant');
    }

    const grantedPermissions = await snapsProvider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID, // We only want gator-permissions-snap for now but we will use more snaps in the future
        request: {
          method: ExternalMethod.PermissionProviderGrantPermissions,
          params: {
            permissionsRequest: relevantPermissionsRequestToGrant,
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
