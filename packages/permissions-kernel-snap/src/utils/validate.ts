import { SnapError } from '@metamask/snaps-sdk';
import type { z } from 'zod';

import type {
  PermissionOffer,
  PermissionsRequest,
  RegisteredPermissionOffer,
  zTypeDescriptor,
} from '@metamask/7715-permissions-shared/src';
import {
  extractZodError,
  zPermissionOffer,
  zPermissionsRequest,
} from '@metamask/7715-permissions-shared/src';
import {
  InternalMethod,
  PERMISSIONS_PROVIDER_SNAP_ID,
} from '../permissions/origin';

export const validatePermissionRequestParam = (
  params: any,
): PermissionsRequest => {
  const validatePermissionsRequest = zPermissionsRequest.safeParse(params);
  if (!validatePermissionsRequest.success) {
    throw new Error(
      extractZodError(
        InternalMethod.WalletGrantPermissions,
        validatePermissionsRequest.error.errors,
      ),
    );
  }

  if (validatePermissionsRequest.data.length === 0) {
    throw new SnapError('params are empty');
  }

  return validatePermissionsRequest.data;
};

export const validatePermissionOfferParam = (params: any): PermissionOffer => {
  const validatePermissionOffer = zPermissionOffer.safeParse(params);
  if (!validatePermissionOffer.success) {
    throw new Error(
      extractZodError(
        InternalMethod.WalletGrantPermissions,
        validatePermissionOffer.error.errors,
      ),
    );
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
