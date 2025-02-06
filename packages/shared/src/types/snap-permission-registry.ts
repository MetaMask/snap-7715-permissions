import { z } from 'zod';

import { zPermissionsRequest, zTypeDescriptor } from './7715-permissions';

// //////////////////////////// Permisions Registry //////////////////////////////

export const zPermissionOffer = z.object({
  // Used to propose this permission in response to requests:
  type: zTypeDescriptor,

  // Used to represent the permission to the user:
  proposedName: z.string(),

  // Used to call the method on the snap:
  id: z.string(),
});

/**
 * This is a local permissions offer definition by the permission's provider snaps
 */
export type PermissionOffer = z.infer<typeof zPermissionOffer>;

export const zRegisteredPermissionOffer = z.object({
  // An identifier for which snap this permission belongs to:
  hostId: z.string(),

  // A type used for matching requests:
  type: zTypeDescriptor,

  // An identifier used for identifying the specific permission defined by the permission provider snap:
  hostPermissionId: z.string(),

  // Used to represent the permission to the user:
  proposedName: z.string(),
});

/**
 * This stored offer given by permission's provider snaps.
 */
export type RegisteredPermissionOffer = z.infer<
  typeof zRegisteredPermissionOffer
>;

export const zPermissionOfferRegistry = z.record(
  z.string(),
  z.array(zRegisteredPermissionOffer),
);

/**
 * This is the registry of all registered permission capabilities offered by permission's provider snaps.
 * It is how the kernel encodes its knowledge of a permission.
 * The key is the snap host id.
 */
export type PermissionOfferRegistry = z.infer<typeof zPermissionOfferRegistry>;

export const zGrantAttenuatedPermissionsParams = z.object({
  permissionsRequest: zPermissionsRequest,
  siteOrigin: z.string(),
});
export type GrantAttenuatedPermissionsParams = z.infer<
  typeof zGrantAttenuatedPermissionsParams
>;

export const zGatorPermission = z.object({
  // A type used for matching requests:
  type: zTypeDescriptor,

  // Used to represent the permission to the user:
  proposedName: z.string(),
});

export type GatorPermission = z.infer<typeof zGatorPermission>;

/**
 * The default permission offers that the Gator snap will offer to the kernel snap
 */
export const DEFAULT_OFFERS: GatorPermission[] = [
  {
    type: 'native-token-transfer',
    proposedName: 'Native Token Transfer',
  },
  {
    type: 'erc20-token-transfer',
    proposedName: 'ERC20 Token Transfer',
  },
];

/**
 * Generates a unique ID for a permission offer.
 *
 * @param permissionToOffer - The permission to offer to the kernel snap.
 * @returns A promise that resolves to the unique ID for the permission offer.
 */
export const getIdFor = async (
  permissionToOffer: GatorPermission,
): Promise<string> => {
  const permissionString = JSON.stringify(permissionToOffer);

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
};
