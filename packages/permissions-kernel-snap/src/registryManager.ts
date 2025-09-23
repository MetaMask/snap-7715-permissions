/* eslint-disable @typescript-eslint/no-throw-literal */
import {
  type PermissionOffers,
  type PermissionsRequest,
  zPermissionOffers,
  type RegisteredPermissionOffer,
  type RegisteredPermissionOffers,
  type PermissionOfferRegistry,
} from '@metamask/7715-permissions-shared/types';
import {
  extractPermissionName,
  extractZodError,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError, type SnapsProvider } from '@metamask/snaps-sdk';

import { ExternalMethod } from './rpc/rpcMethod';

export type FindRelevantPermissionsToGrantResult = {
  permissionsToGrant: PermissionsRequest;
  missingPermissions: PermissionsRequest;
  errorMessage?: string;
};

export type PermissionOfferRegistryManager = {
  buildPermissionOffersRegistry: (
    snapId: string,
  ) => Promise<PermissionOfferRegistry>;
  getRegisteredPermissionOffers: (
    permissionOfferRegistry: PermissionOfferRegistry,
  ) => RegisteredPermissionOffers;
  findRelevantPermissionsToGrant: (options: {
    allRegisteredOffers: RegisteredPermissionOffer[];
    permissionsToGrant: PermissionsRequest;
  }) => FindRelevantPermissionsToGrantResult;
};

export const createPermissionOfferRegistryManager = (
  snapsProvider: SnapsProvider,
): PermissionOfferRegistryManager => {
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
   * Discovers and builds the permissions provider registry by querying all permissions provider snaps
   * for their permission offers.
   *
   * @param snapId - The snap id to query for permission offers.
   * @returns The permissions provider registry.
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
              method: ExternalMethod.PermissionsProviderGetPermissionOffers,
            },
          },
        });

        if (response) {
          const parsedOffers = parsePermissionOffersParam(response);
          const uniqueOffersToStore: RegisteredPermissionOffers =
            parsedOffers.map((offer) => {
              return {
                hostId: snapId,
                type: offer.type,
                proposedName: offer.proposedName,
              };
            });

          ephemeralPermissionOfferRegistry = {
            ...ephemeralPermissionOfferRegistry,
            [snapId]: uniqueOffersToStore,
          };

          logger.debug(
            `Snap ${snapId} supports ${ExternalMethod.PermissionsProviderGetPermissionOffers}, adding to registry...`,
          );
        }
      } catch (error) {
        logger.error(
          `Snap ${snapId} does not support ${ExternalMethod.PermissionsProviderGetPermissionOffers}, or returned an invalid response, skipping...`,
        );
      }

      return ephemeralPermissionOfferRegistry;
    } catch (error) {
      logger.error('Error building permission offer registry');
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

    return Object.values(permissionOfferRegistry).flat();
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
   * @param options.permissionsToGrant - The permissions requested by the site.
   * @returns The result of finding relevant permissions to grant.
   */
  function findRelevantPermissionsToGrant(options: {
    allRegisteredOffers: RegisteredPermissionOffer[];
    permissionsToGrant: PermissionsRequest;
  }): FindRelevantPermissionsToGrantResult {
    const { allRegisteredOffers, permissionsToGrant } = options;
    if (permissionsToGrant.length === 0) {
      return {
        permissionsToGrant: [],
        missingPermissions: [],
      };
    }

    const missingPermissions = permissionsToGrant.filter(
      (permission) =>
        !allRegisteredOffers.some(
          (offer) =>
            extractPermissionName(permission.permission.type) ===
            extractPermissionName(offer.type),
        ),
    );

    // Permission provider does not support all permissions requested, so we return an error message
    if (missingPermissions.length > 0) {
      return {
        permissionsToGrant: [],
        missingPermissions,
        errorMessage: `The following permissions can not be granted by the permissions provider: ${missingPermissions.map((permission) => permission.permission.type).join(', ')}`,
      };
    }

    return {
      missingPermissions: [],
      permissionsToGrant,
    };
  }

  return {
    buildPermissionOffersRegistry,
    getRegisteredPermissionOffers,
    findRelevantPermissionsToGrant,
  };
};
