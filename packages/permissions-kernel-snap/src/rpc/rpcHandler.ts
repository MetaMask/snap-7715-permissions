import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  InternalError,
  InvalidInputError,
  type Json,
  type SnapsProvider,
} from '@metamask/snaps-sdk';

import type { PermissionOfferRegistryManager } from '../registryManager';
import {
  parsePermissionRequestParam,
  parsePermissionsResponseParam,
} from '../utils';
import { ExternalMethod } from './rpcMethod';
import { deserializeSnapError } from '../utils/error';

/**
 * Type for the RPC handler methods.
 */
export type RpcHandler = {
  /**
   * Handles request execution permission requests.
   *
   * @param options - The configuration for the grant permission request.
   * @param options.siteOrigin - The origin of the site requesting the permissions.
   * @param options.params - The parameters for the grant permission request.
   * @returns The result of the grant permission request.
   */
  requestExecutionPermissions(options: {
    siteOrigin: string;
    params?: Json;
  }): Promise<Json>;

  /**
   * Handles get supported execution permissions requests.
   *
   * @returns The supported permission types with their chainIds and ruleTypes.
   */
  getSupportedExecutionPermissions(): Promise<Json>;

  /**
   * Handles get granted execution permissions requests.
   *
   * @param options - The configuration for retrieving granted permissions.
   * @param options.siteOrigin - The origin of the site requesting the permissions.
   * @returns The granted permissions filtered by site origin and not revoked.
   */
  getGrantedExecutionPermissions(options: {
    siteOrigin: string;
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
  const requestExecutionPermissions = async (options: {
    siteOrigin: string;
    params?: Json;
  }): Promise<Json> => {
    logger.debug({ options }, 'grantPermissions()');
    const parsedPermissionsRequest = parsePermissionRequestParam(
      options.params,
    );

    const gatorPermissionsProviderSnapId =
      // eslint-disable-next-line no-restricted-globals
      process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;

    if (!gatorPermissionsProviderSnapId) {
      throw new InternalError(
        'GATOR_PERMISSIONS_PROVIDER_SNAP_ID must be set as an environment variable.',
      );
    }

    // We only want gator-permissions-snap for now but we will use more snaps in the future
    const permissionOfferRegistry =
      await permissionOfferRegistryManager.buildPermissionOffersRegistry(
        gatorPermissionsProviderSnapId,
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
      throw new InvalidInputError(errorMessage);
    }

    try {
      const grantedPermissions = await snapsProvider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: gatorPermissionsProviderSnapId, // We only want gator-permissions-snap for now but we will use more snaps in the future
          request: {
            method: ExternalMethod.PermissionsProviderGrantPermissions,
            params: {
              permissionsRequest: permissionsToGrant,
              siteOrigin: options.siteOrigin,
            } as Json,
          },
        },
      });

      return parsePermissionsResponseParam(grantedPermissions) as Json;
    } catch (error) {
      // When errors cross snap boundaries via wallet_invokeSnap, they get serialized
      // and lose their type information. Try to deserialize them back to proper Snap errors.
      const deserializedError = deserializeSnapError(error);
      if (deserializedError) {
        throw deserializedError;
      }

      // Re-throw other errors as-is
      throw error;
    }
  };

  /**
   * Handles get supported execution permissions requests.
   *
   * @returns The supported permission types with their chainIds and ruleTypes.
   */
  const getSupportedExecutionPermissions = async (): Promise<Json> => {
    logger.debug('getSupportedExecutionPermissions()');

    const gatorPermissionsProviderSnapId =
      // eslint-disable-next-line no-restricted-globals
      process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;

    if (!gatorPermissionsProviderSnapId) {
      throw new InternalError(
        'GATOR_PERMISSIONS_PROVIDER_SNAP_ID must be set as an environment variable.',
      );
    }

    try {
      return await snapsProvider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: gatorPermissionsProviderSnapId,
          request: {
            method: ExternalMethod.PermissionsProviderGetSupportedPermissions,
          },
        },
      });
    } catch (error) {
      const deserializedError = deserializeSnapError(error);
      if (deserializedError) {
        throw deserializedError;
      }
      throw error;
    }
  };

  /**
   * Handles get granted execution permissions requests.
   *
   * @param options - The configuration for retrieving granted permissions.
   * @param options.siteOrigin - The origin of the site requesting the permissions.
   * @returns The granted permissions filtered by site origin and not revoked.
   */
  const getGrantedExecutionPermissions = async (options: {
    siteOrigin: string;
  }): Promise<Json> => {
    logger.debug({ options }, 'getGrantedExecutionPermissions()');

    const gatorPermissionsProviderSnapId =
      // eslint-disable-next-line no-restricted-globals
      process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;

    if (!gatorPermissionsProviderSnapId) {
      throw new InternalError(
        'GATOR_PERMISSIONS_PROVIDER_SNAP_ID must be set as an environment variable.',
      );
    }

    try {
      const grantedPermissions = await snapsProvider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: gatorPermissionsProviderSnapId,
          request: {
            method: ExternalMethod.PermissionsProviderGetGrantedPermissions,
            params: {
              siteOrigin: options.siteOrigin,
              isRevoked: false,
            } as Json,
          },
        },
      });

      // Extract permissionResponse from each StoredGrantedPermission
      if (!Array.isArray(grantedPermissions)) {
        return [];
      }

      return (grantedPermissions as { permissionResponse: Json }[]).map(
        (permission) => permission.permissionResponse,
      );
    } catch (error) {
      const deserializedError = deserializeSnapError(error);
      if (deserializedError) {
        throw deserializedError;
      }
      throw error;
    }
  };

  return {
    requestExecutionPermissions,
    getSupportedExecutionPermissions,
    getGrantedExecutionPermissions,
  };
}
