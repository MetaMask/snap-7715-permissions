import { GATOR_PERMISSIONS_PROVIDER_SNAP_ID } from '@metamask/7715-permissions-shared/constants';
import type {
  RegisteredPermissionOffers,
  PermissionsRequest,
  GrantAttenuatedPermissionsParams,
} from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json, SnapsProvider } from '@metamask/snaps-sdk';

import type { Registry } from '../registry';
import type { StateManager } from '../stateManagement';
import { EmptyRegistryPage, NoOffersFoundPage } from '../ui';
import { parsePermissionRequestParam } from '../utils';
import { ExternalMethod } from './rpcMethod';

/**
 * Type for the RPC handler methods.
 */
export type RpcHandler = {
  /**
   * Handles grant permission requests.
   *
   * @param params - The parameters for the grant permission request.
   * @param siteOrigin - The origin of the site requesting the permissions.
   * @returns The result of the grant permission request.
   */
  grantPermissions(siteOrigin: string, params?: Json): Promise<Json>;
};

/**
 * Creates an RPC handler with methods for handling permission-related RPC requests.
 *
 * @param config - The parameters for creating the RPC handler.
 * @param config.stateManager - The state manager.
 * @param config.registry - The registry of permission offers.
 * @param config.snapsProvider - The snaps provider.
 * @returns An object with RPC handler methods.
 */
export function createRpcHandler(config: {
  stateManager: StateManager;
  registry: Registry;
  snapsProvider: SnapsProvider;
}): RpcHandler {
  const { stateManager, registry, snapsProvider } = config;

  /**
   * Handles grant permission requests.
   *
   * @param siteOrigin - The origin of the site requesting the permissions.
   * @param params - The parameters for the grant permission request.
   * @returns The result of the grant permission request.
   */
  const grantPermissions = async (
    siteOrigin: string,
    params?: Json,
  ): Promise<Json> => {
    logger.debug('grantPermissions()', { params, siteOrigin });
    const permissionsToGrant = parsePermissionRequestParam(params);
    const permissionOfferRegistry =
      await registry.buildPermissionProviderRegistry();

    if (Object.keys(permissionOfferRegistry).length === 0) {
      await snapsProvider.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: EmptyRegistryPage(),
        },
      });
      return [];
    }

    // Filter permissions against the registered offers from all permission providers
    const allRegisteredOffers: RegisteredPermissionOffers =
      registry.reducePermissionOfferRegistry(permissionOfferRegistry);
    const relevantPermissionsToGrant: PermissionsRequest =
      registry.findRelevantPermissions(allRegisteredOffers, permissionsToGrant);

    if (relevantPermissionsToGrant.length === 0) {
      logger.info(
        `No relevant permissions to grant for origin ${siteOrigin}`,
        JSON.stringify(permissionsToGrant, null, 2),
      );
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: NoOffersFoundPage(siteOrigin, permissionsToGrant),
        },
      });
      return [];
    }

    // Store the permission offer registry in the state manager on every request
    // to allow home page to display the permission offers
    // Once preinstall is implemented, we can remove this since home page will not be accessible
    await stateManager.setState({
      permissionOfferRegistry,
    });

    // attenuate by sending permissions to the permission provider
    const grantAttenuatedPermissionsParams: GrantAttenuatedPermissionsParams = {
      permissionsRequest: relevantPermissionsToGrant,
      siteOrigin,
    };
    const grantedPermissions = await snapsProvider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
        request: {
          method: ExternalMethod.PermissionProviderGrantAttenuatedPermissions,
          params: grantAttenuatedPermissionsParams as Json,
        },
      },
    });

    return grantedPermissions;
  };

  return {
    grantPermissions,
  };
}
