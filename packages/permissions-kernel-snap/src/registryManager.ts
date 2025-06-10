/* eslint-disable @typescript-eslint/no-throw-literal */
import type {
  PermissionOffers,
  PermissionOfferWithHostId,
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

export type PermissionOfferRegistryManager = {
  buildPermissionOffersRegistry: (
    snapId: string,
  ) => Promise<PermissionOfferRegistry>;
  findRelevantPermissionsToGrant: (options: {
    allRegisteredOffers: RegisteredPermissionOffer[];
    permissionsToGrant: PermissionsRequest;
  }) => PermissionsRequest;
  getRegisteredPermissionOffers: (
    permissionOfferRegistry: PermissionOfferRegistry,
  ) => RegisteredPermissionOffers;
};

export const createPermissionOfferRegistryManager = (
  snapsProvider: SnapsProvider,
): PermissionOfferRegistryManager => {
  /**
   * Generates a unique ID for a permission offer with the hostId added.
   * The hostId is used to increase the uniqueness of the ID since the same permission offer can be offered by multiple snaps.
   *
   * @param permissionOfferWithHostId - The permission to offer to the kernel snap with the hostId added.
   * @returns A promise that resolves to the unique ID for the permission offer.
   */
  async function deriveIdFromPermissionOffer(
    permissionOfferWithHostId: PermissionOfferWithHostId,
  ): Promise<string> {
    const permissionString = JSON.stringify(permissionOfferWithHostId);

    // Encode the text as a UTF-8 byte array
    const encoder = new TextEncoder();
    const data = encoder.encode(permissionString);

    // Hash the data with SHA-256
    // crypto is allowed in the snap environment via polyfill(see ./snap.config.ts)
    // eslint-disable-next-line no-restricted-globals
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert the hash to a hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');

    return hashHex;
  }

  /**
   * Safely parses the permissions offer request parameters, validating them using Zod schema.
   *
   * @param params - The permission offer to parse.
   * @returns The parsed and validated permissions offer as a PermissionOffer object.
   * @throws Throws a SnapError if validation fails.
   */
  function parsePermissionOffersParam(params: unknown): PermissionOffers {
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
   *
   * @param options - The options for finding relevant permissions to grant.
   * @param options.allRegisteredOffers - All the registered permission offers.
   * @param options.permissionsToGrant - The permissions to grant.
   * @returns The relevant permissions to grant or empty array if no match is found.
   */
  function findRelevantPermissionsToGrant(options: {
    allRegisteredOffers: RegisteredPermissionOffer[];
    permissionsToGrant: PermissionsRequest;
  }): PermissionsRequest {
    const { allRegisteredOffers, permissionsToGrant } = options;

    return permissionsToGrant.filter((permissionRequest) => {
      return allRegisteredOffers.some(
        (registeredOffer) =>
          extractPermissionName(registeredOffer.type) ===
          extractPermissionName(permissionRequest.permission.type),
      );
    });
  }

  /**
   * Discovers and builds the permission provider registry by querying all permission provider snaps
   * for their permission offers.
   *
   * @param snapId - The snap id to query for permission offers.
   * @returns The permission provider registry.
   */
  async function buildPermissionOffersRegistry(
    snapId: string,
  ): Promise<PermissionOfferRegistry> {
    let ephemeralPermissionOfferRegistry: PermissionOfferRegistry = {};
    try {
      try {
        logger.debug(`Querying snap ${snapId} for permission offers...`);

        const response = await snapsProvider.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId,
            request: {
              method: ExternalMethod.PermissionProviderGetPermissionOffers,
            },
          },
        });

        if (response) {
          const parsedOffers = parsePermissionOffersParam(response);
          const uniqueOffersToStore: RegisteredPermissionOffers = (
            await Promise.all(
              parsedOffers.map(async (offer) => {
                const hostPermissionId = await deriveIdFromPermissionOffer({
                  ...offer,
                  hostId: snapId,
                });
                return {
                  hostId: snapId,
                  type: offer.type,
                  hostPermissionId,
                  proposedName: offer.proposedName,
                };
              }),
            )
          ).filter(
            (currentOffer, currentIndex, allOffers) =>
              currentIndex ===
              allOffers.findIndex(
                (comparisonOffer: RegisteredPermissionOffer) =>
                  comparisonOffer.hostPermissionId ===
                  currentOffer.hostPermissionId,
              ),
          );

          ephemeralPermissionOfferRegistry = {
            ...ephemeralPermissionOfferRegistry,
            [snapId]: uniqueOffersToStore,
          };

          logger.debug(
            `Snap ${snapId} supports ${ExternalMethod.PermissionProviderGetPermissionOffers}, adding to registry...`,
          );
        }
      } catch (error) {
        logger.error(
          {
            snapId,
            error,
          },
          `Snap ${snapId} does not support ${ExternalMethod.PermissionProviderGetPermissionOffers}, or returned an invalid response, skipping...`,
        );
      }

      return ephemeralPermissionOfferRegistry;
    } catch (error) {
      logger.error('Error building permission offer registry:', error);
      return ephemeralPermissionOfferRegistry;
    }
  }

  /**
   * Flattens the permission offer registry into a single array of registered permission offers.
   *
   * @param permissionOfferRegistry - The permission offer registry to flatten.
   * @returns The registered permission offers.
   */
  function getRegisteredPermissionOffers(
    permissionOfferRegistry: PermissionOfferRegistry,
  ): RegisteredPermissionOffers {
    if (Object.keys(permissionOfferRegistry).length === 0) {
      return [];
    }

    return Object.values(permissionOfferRegistry).reduce(
      (acc, offers) => [...acc, ...offers],
      [],
    );
  }

  return {
    buildPermissionOffersRegistry,
    findRelevantPermissionsToGrant,
    getRegisteredPermissionOffers,
  };
};
