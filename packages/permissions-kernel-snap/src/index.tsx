import type {
  GrantAttenuatedPermissionsParams,
  RegisteredPermissionOffer,
} from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json, OnHomePageHandler } from '@metamask/snaps-sdk';
import {
  MethodNotFoundError,
  SnapError,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';

import { InternalMethod, PERMISSIONS_PROVIDER_SNAP_ID } from './permissions';
import { createStateManager } from './stateManagement';
import { HomePageContent, EmptyRegistryPage, NoOffersFoundPage } from './ui';
import {
  checkForDuplicatePermissionOffer,
  parsePermissionOfferParam,
  parsePermissionRequestParam,
  findRelevantPermissions,
  isSnapRpcError,
} from './utils';

const stateManager = createStateManager();

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
      case InternalMethod.WalletGetRegisteredOnchainPermissionOffers: {
        const { permissionOfferRegistry } = await stateManager.getState();
        return (permissionOfferRegistry[origin] ?? []) as Json[];
      }

      case InternalMethod.WalletOfferOnchainPermission: {
        const offered = parsePermissionOfferParam(request.params);
        logger.info(
          `New permission offer to register:`,
          JSON.stringify(offered, undefined, 2),
        );
        const offerToStore: RegisteredPermissionOffer = {
          hostId: origin,
          type: offered.type,
          hostPermissionId: offered.id,

          proposedName: offered.proposedName,
        };

        const state = await stateManager.getState();
        const hostStoredOffers = state.permissionOfferRegistry[origin] ?? [];
        const foundDup = checkForDuplicatePermissionOffer(
          offerToStore,
          hostStoredOffers,
        );
        if (foundDup) {
          logger.warn(
            `Duplicate permission offer found for host ${origin}. Skipping registration.`,
          );
          return true;
        }

        // store the offer in the registry
        const updatedOfferRegistry = {
          ...state,
          permissionOfferRegistry: {
            [origin]: [...hostStoredOffers, offerToStore],
          },
        };
        await stateManager.setState(updatedOfferRegistry);
        logger.debug(
          `Update the permission offer registry:`,
          JSON.stringify(updatedOfferRegistry, undefined, 2),
        );

        return true;
      }

      case InternalMethod.WalletGrantPermissions: {
        const permissionsToGrant = parsePermissionRequestParam(request.params);
        const { permissionOfferRegistry } = await stateManager.getState();
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

        // Filter permissions against the registered offers from the permission provider
        const allRegisteredOffers = Object.values(
          permissionOfferRegistry,
        ).reduce((acc, offers) => [...acc, ...offers], []);
        const relevantPermissionsToGrant = findRelevantPermissions(
          allRegisteredOffers,
          permissionsToGrant,
        );

        // When no offer match found: prompt user and ending request
        if (relevantPermissionsToGrant.length === 0) {
          await snap.request({
            method: 'snap_dialog',
            params: {
              type: 'alert',
              content: NoOffersFoundPage(origin, permissionsToGrant),
            },
          });
          return null;
        }

        // TODO: Validate the response returned from permission provider before sending to site
        //  attenuate by sending them to the permission provider
        const grantAttenuatedPermissionsParams: GrantAttenuatedPermissionsParams =
          {
            permissionsRequest: relevantPermissionsToGrant,
            siteOrigin: origin,
          };
        return await snap.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: PERMISSIONS_PROVIDER_SNAP_ID,
            request: {
              method:
                InternalMethod.PermissionProviderGrantAttenuatedPermissions,
              params: grantAttenuatedPermissionsParams as Json,
            },
          },
        });
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
