import { InvalidParamsError } from '@metamask/snaps-sdk';
import type { z } from 'zod';

import type {
  PermissionOffer,
  PermissionsRequest,
  RegisteredPermissionOffer,
  zTypeDescriptor,
} from '../../../shared/src/types';
import {
  extractZodError,
  zPermissionOffer,
  zPermissionsRequest,
} from '../../../shared/src/types';
import { PERMISSIONS_PROVIDER_SNAP_ID } from '../permissions/origin';

/**
 * Safely parses the grant permissions request parameters, validating them using Zod schema.
 *
 * @param params - The permissions to parse.
 * @returns The parsed and validated permissions as a PermissionsRequest object.
 * @throws Throws a InvalidParamsError if validation fails or if the permissions data is empty.
 */
export const parsePermissionRequestParam = (
  params: any,
): PermissionsRequest => {
  const validatePermissionsRequest = zPermissionsRequest.safeParse(params);
  if (!validatePermissionsRequest.success) {
    throw new InvalidParamsError(
      extractZodError(validatePermissionsRequest.error.errors),
    ) as unknown as Error;
  }

  if (validatePermissionsRequest.data.length === 0) {
    throw new InvalidParamsError('params are empty') as unknown as Error;
  }

  return validatePermissionsRequest.data;
};

/**
 * Safely parses the permisssions offer request parameters, validating them using Zod schema.
 *
 * @param params - The permission offer to parse.
 * @returns The parsed and validated permissions offer as a PermissionOffer object.
 * @throws Throws a SnapError if validation fails.
 */
export const parsePermissionOfferParam = (params: any): PermissionOffer => {
  const validatePermissionOffer = zPermissionOffer.safeParse(params);
  if (!validatePermissionOffer.success) {
    throw new InvalidParamsError(
      extractZodError(validatePermissionOffer.error.errors),
    ) as unknown as Error;
  }

  return validatePermissionOffer.data;
};

/**
 * Check for duplicate permission offer against the stored offers for a permission provider host.
 *
 * @param offerToStore - The permission offer to store(offer to check for duplicates).
 * @param hostStoredOffers - The stored permission offers for the host.
 * @returns True if there is a duplicate, false otherwise.
 */
export const checkForDuplicatePermissionOffer = (
  offerToStore: RegisteredPermissionOffer,
  hostStoredOffers: RegisteredPermissionOffer[],
): boolean => {
  if (hostStoredOffers.length === 0) {
    return false;
  }

  const foundDup = hostStoredOffers.find(
    (offer) => offer.hostPermissionId === offerToStore.hostPermissionId,
  );

  return Boolean(foundDup);
};

/**
 * Extracts the name of a permission from a permission type.
 *
 * @param type - The type of permission to extract the name from.
 * @returns The name of the permission.
 */
export const extractPermissionName = (
  type: z.infer<typeof zTypeDescriptor>,
): string => {
  if (typeof type === 'object') {
    return type.name;
  }
  return type;
};

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
export const findRelevantPermissions = (
  allRegisteredOffers: RegisteredPermissionOffer[],
  permissionsToGrant: PermissionsRequest,
): PermissionsRequest => {
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
};
