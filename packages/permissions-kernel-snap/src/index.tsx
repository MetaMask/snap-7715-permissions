import type {
  GrantAttenuatedPermissionsParams,
  PermissionsRequest,
  RegisteredPermissionOffers,
} from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json, OnHomePageHandler } from '@metamask/snaps-sdk';
import {
  MethodNotFoundError,
  SnapError,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';

import { InternalMethod } from './permissions';
import { createRegistry } from './registry';
import { createStateManager } from './stateManagement';
import { HomePageContent, EmptyRegistryPage, NoOffersFoundPage } from './ui';
import { parsePermissionRequestParam, isSnapRpcError } from './utils';

const stateManager = createStateManager();
const registry = createRegistry();

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  logger.info(
    `Custom request (origin="${origin}"):`,
    JSON.stringify(request, undefined, 2),
  );

  try {
    switch (request.method) {
      case InternalMethod.WalletGrantPermissions: {
        const permissionsToGrant = parsePermissionRequestParam(request.params);
        const permissionOfferRegistry =
          await registry.buildPermissionProviderRegistry();

        // Temp: Store the permission offer registry in the state manager on every request
        // to allow home page to display the permission offers
        // Once preinstall is implemented, we can remove this since home page will not be accessible
        await stateManager.setState({
          permissionOfferRegistry,
        });

        if (Object.keys(permissionOfferRegistry).length === 0) {
          await snap.request({
            method: 'snap_dialog',
            params: {
              type: 'alert',
              content: EmptyRegistryPage(),
            },
          });
          return null;
        }

        // Filter permissions against the registered offers from all permission providers
        const allRegisteredOffers: RegisteredPermissionOffers =
          registry.reducePermissionOfferRegistry(permissionOfferRegistry);
        const relevantPermissionsToGrant: PermissionsRequest =
          registry.findRelevantPermissions(
            allRegisteredOffers,
            permissionsToGrant,
          );

        if (relevantPermissionsToGrant.length === 0) {
          logger.info(
            `No relevant permissions to grant for origin ${origin}`,
            JSON.stringify(permissionsToGrant, null, 2),
          );
          await snap.request({
            method: 'snap_dialog',
            params: {
              type: 'alert',
              content: NoOffersFoundPage(origin, permissionsToGrant),
            },
          });
          return null;
        }

        // Forward permissions to each provider sequentially
        const aggregateGrantedPermissions: Json[] = [];
        for (const [providerSnapId] of Object.entries(
          permissionOfferRegistry,
        )) {
          try {
            const grantAttenuatedPermissionsParams: GrantAttenuatedPermissionsParams =
              {
                permissionsRequest: relevantPermissionsToGrant,
                siteOrigin: origin,
              };

            logger.info(
              `Forwarding permission request to to provider ${providerSnapId}:`,
              JSON.stringify(grantAttenuatedPermissionsParams, null, 2),
            );

            const response = await snap.request({
              method: 'wallet_invokeSnap',
              params: {
                snapId: providerSnapId,
                request: {
                  method:
                    InternalMethod.PermissionProviderGrantAttenuatedPermissions,
                  params: {
                    permissions: grantAttenuatedPermissionsParams as Json,
                    origin,
                  } as Json,
                },
              },
            });

            logger.info(
              `Received response from provider ${providerSnapId}:`,
              JSON.stringify(response, null, 2),
            );

            if (response && Array.isArray(response)) {
              // TODO: Validate the response returned from permission provider response before appending to aggregated response
              aggregateGrantedPermissions.push(...response);
            }
          } catch (error) {
            logger.error(
              `Error granting permissions from provider ${providerSnapId}:`,
              error,
            );
          }
        }

        return aggregateGrantedPermissions;
      }
      default: {
        throw new MethodNotFoundError() as unknown as Error;
      }
    }
  } catch (error: any) {
    let snapError = error;

    if (!isSnapRpcError(error)) {
      snapError = new SnapError(error);
    }
    logger.error(
      `onRpcRequest error: ${JSON.stringify(snapError.toJSON(), null, 2)}`,
    );
    throw snapError;
  }
};

/**
 * Handle the onHomePage event.
 * @returns The content to display on the home page.
 */
export const onHomePage: OnHomePageHandler = async () => {
  const { permissionOfferRegistry } = await stateManager.getState();
  return HomePageContent(permissionOfferRegistry);
};
