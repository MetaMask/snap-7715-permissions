/* eslint-disable @typescript-eslint/no-throw-literal */
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
import { InvalidParamsError } from '@metamask/snaps-sdk';

import { InternalMethod, PERMISSIONS_PROVIDER_SNAP_ID } from './permissions';

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

export const createRegistry = (): Registry => {
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
          registeredOffer.hostId === PERMISSIONS_PROVIDER_SNAP_ID
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
      const installedSnaps = await snap.request({
        method: 'wallet_getSnaps',
      });

      let ephemeralPermissionOfferRegistry: PermissionOfferRegistry = {};

      // Query each snap for permission offers
      for (const [snapId] of Object.entries(installedSnaps)) {
        try {
          logger.debug(`Querying snap ${snapId} for permission offers...`);

          const response = await snap.request({
            method: 'wallet_invokeSnap',
            params: {
              snapId,
              request: {
                method: InternalMethod.PermissionProviderGetPermissionOffers,
              },
            },
          });

          // Only add snaps that return valid responses
          if (response && typeof response === 'object') {
            const parsedOffers = parsePermissionOffersParam(response);
            const uniqueOffersToStore: RegisteredPermissionOffers = parsedOffers
              .map((offer) => ({
                hostId: snapId,
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
              [snapId]: uniqueOffersToStore,
            };

            logger.debug(
              `Snap ${snapId} supports permissions_offerPermissions, adding to registry...`,
            );
          }
        } catch (error) {
          logger.debug(
            {
              snapId,
              error,
            },
            `Snap ${snapId} does not support permissions_offerPermissions, or returned an invalid response, skipping...`,
          );
        }
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
