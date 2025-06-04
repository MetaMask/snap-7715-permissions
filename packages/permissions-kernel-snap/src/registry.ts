/* eslint-disable @typescript-eslint/no-throw-literal */
import { GATOR_PERMISSIONS_PROVIDER_SNAP_ID } from '@metamask/7715-permissions-shared/constants';
import type {
  PermissionOffers,
  PermissionsRequest,
  RegisteredPermissionOffer,
  RegisteredPermissionOffers,
} from '@metamask/7715-permissions-shared/types';
import {
  zPermissionOffers,
  type PermissionOfferRegistry,
} from '@metamask/7715-permissions-shared/types';
import {
  extractPermissionName,
  extractZodError,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import { InvalidParamsError } from '@metamask/snaps-sdk';

import { ExternalMethod } from './rpc/rpcMethod';

export type Registry = {
  buildPermissionProviderRegistry: () => Promise<PermissionOfferRegistry>;
  findRelevantPermissions: (
    allRegisteredOffers: RegisteredPermissionOffer[],
    permissionsToGrant: PermissionsRequest,
  ) => PermissionsRequest;
  reducePermissionOfferRegistry: (
    permissionOfferRegistry: PermissionOfferRegistry,
  ) => RegisteredPermissionOffers;
};

export const createRegistry = (snapsProvider: SnapsProvider): Registry => {
  /**
   * Safely parses the permissions offer request parameters, validating them using Zod schema.
   *
   * @param params - The permission offer to parse.
   * @returns The parsed and validated permissions offer as a PermissionOffer object.
   * @throws Throws a SnapError if validation fails.
   */
  function parsePermissionOffersParam(params: any): PermissionOffers {
    const validatePermissionOffers = zPermissionOffers.safeParse(params);
    if (!validatePermissionOffers.success) {
      throw new InvalidParamsError(
        extractZodError(validatePermissionOffers.error.errors),
      );
    }

    if (validatePermissionOffers.data.length === 0) {
      throw new InvalidParamsError('params are empty');
    }

    return validatePermissionOffers.data;
  }

  /**
   * Find all the relevant permissions that map to a registered permission offer.
   *
   * Currently just matches type. Here is where we would add a rich type description system.
   * Could start by recognizing some extra parameters for known permission types.
   * But eventually would be great to have some general-purpose type fields.
   * We also default to only matching on offers from the gator-snap, but eventually we would need to adjust to allow other permissions providers.
   *
   * @param allRegisteredOffers - All the registered permission offers.
   * @param permissionsToGrant - The permissions to grant.
   * @returns The relevant permissions to grant or empty array if no match is found.
   */
  function findRelevantPermissions(
    allRegisteredOffers: RegisteredPermissionOffer[],
    permissionsToGrant: PermissionsRequest,
  ): PermissionsRequest {
    return permissionsToGrant.filter((permissionRequest) => {
      const foundMatchingOffer = allRegisteredOffers.find((registeredOffer) => {
        if (
          extractPermissionName(registeredOffer.type) ===
            extractPermissionName(permissionRequest.permission.type) &&
          registeredOffer.hostId === GATOR_PERMISSIONS_PROVIDER_SNAP_ID
        ) {
          return true;
        }
        return false;
      });

      if (foundMatchingOffer) {
        return permissionRequest;
      }

      return null;
    });
  }

  /**
   * Discovers and builds the permission provider registry by querying all installed snaps
   * for their permission offers.
   *
   * @returns The permission provider registry.
   */
  async function buildPermissionProviderRegistry(): Promise<PermissionOfferRegistry> {
    try {
      let ephemeralPermissionOfferRegistry: PermissionOfferRegistry = {};

      // Query permission provider snaps for permission offers
      // We only want gator-permissions-snap for now but we will use more snaps in the future
      try {
        logger.debug(
          `Querying snap ${GATOR_PERMISSIONS_PROVIDER_SNAP_ID} for permission offers...`,
        );

        const response = await snapsProvider.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
            request: {
              method: ExternalMethod.PermissionProviderGetPermissionOffers,
            },
          },
        });

        if (response) {
          const parsedOffers = parsePermissionOffersParam(response);
          const uniqueOffersToStore: RegisteredPermissionOffers = parsedOffers
            .map((offer) => ({
              hostId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
              type: offer.type,
              hostPermissionId: offer.id,
              proposedName: offer.proposedName,
            }))
            .filter(
              (offer, index, self) =>
                index ===
                self.findIndex(
                  (off: RegisteredPermissionOffer) =>
                    off.hostPermissionId === offer.hostPermissionId,
                ),
            );

          ephemeralPermissionOfferRegistry = {
            ...ephemeralPermissionOfferRegistry,
            [GATOR_PERMISSIONS_PROVIDER_SNAP_ID]: uniqueOffersToStore,
          };

          logger.debug(
            `Snap ${GATOR_PERMISSIONS_PROVIDER_SNAP_ID} supports ${ExternalMethod.PermissionProviderGetPermissionOffers}, adding to registry...`,
          );
        }
      } catch (error) {
        logger.debug(
          {
            snapId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
            error,
          },
          `Snap ${GATOR_PERMISSIONS_PROVIDER_SNAP_ID} does not support ${ExternalMethod.PermissionProviderGetPermissionOffers}, or returned an invalid response, skipping...`,
        );
      }

      return ephemeralPermissionOfferRegistry;
    } catch (error) {
      logger.error('Error building permission provider registry:', error);
      throw error;
    }
  }

  /**
   * Reduces the permission offer registry to a single array of registered permission offers.
   *
   * @param permissionOfferRegistry - The permission offer registry to reduce.
   * @returns The reduced permission offer registry.
   */
  function reducePermissionOfferRegistry(
    permissionOfferRegistry: PermissionOfferRegistry,
  ): RegisteredPermissionOffers {
    return Object.values(permissionOfferRegistry).reduce(
      (acc, offers) => [...acc, ...offers],
      [],
    );
  }

  return {
    buildPermissionProviderRegistry,
    findRelevantPermissions,
    reducePermissionOfferRegistry,
  };
};
