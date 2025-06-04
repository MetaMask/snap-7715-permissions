import { zTypeDescriptor } from '@metamask/7715-permissions-shared/types';
import { z } from 'zod';

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
export const DEFAULT_GATOR_PERMISSION_TO_OFFER: GatorPermission[] = [
  {
    type: 'native-token-stream',
    proposedName: 'Native Token Stream',
  },
  {
    type: 'native-token-periodic',
    proposedName: 'Native Token Periodic Transfer',
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
