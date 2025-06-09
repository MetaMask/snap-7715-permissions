import { z } from 'zod';

import { zTypeDescriptor } from './7715-permissions-types';

export const zPermissionOffer = z.object({
  /**
   * 7715 type descriptor for the permission.
   */
  type: zTypeDescriptor,

  /**
   * Used to represent the permission to the user in the permissions picker UI.
   */
  proposedName: z.string(),
});

export const zPermissionOffers = z.array(zPermissionOffer);

/**
 * This is a local permissions offer definition by the permission's provider snaps.
 */
export type PermissionOffer = z.infer<typeof zPermissionOffer>;

/**
 * This is a local permissions offer definition by the permission's provider snaps.
 */
export type PermissionOffers = z.infer<typeof zPermissionOffers>;

export const zPermissionOfferWithHostId = zPermissionOffer.extend({
  /**
   * An identifier for which snap this permission belongs to.
   */
  hostId: z.string(),
});

/**
 * This is a local permissions offer definition by the permission's provider snaps with the hostId added.
 */
export type PermissionOfferWithHostId = z.infer<
  typeof zPermissionOfferWithHostId
>;

export const zRegisteredPermissionOffer = z.object({
  /**
   * An identifier for which snap this permission belongs to.
   */
  hostId: z.string(),

  /**
   * 7715 type descriptor for the permission.
   */
  type: zTypeDescriptor,

  /**
   * An identifier used for identifying the specific permission offered by the permission provider snap defined by the kernel snap.
   */
  hostPermissionId: z.string(),

  /**
   * Used to represent the permission to the user in the permissions picker UI.
   */
  proposedName: z.string(),
});

export const zRegisteredPermissionOffers = z.array(zRegisteredPermissionOffer);

/**
 * This stored offer given by permission's provider snaps.
 */
export type RegisteredPermissionOffer = z.infer<
  typeof zRegisteredPermissionOffer
>;

/**
 * This stored offers given by permission's provider snaps.
 */
export type RegisteredPermissionOffers = z.infer<
  typeof zRegisteredPermissionOffers
>;

export const zPermissionOfferRegistry = z.record(
  z.string(),
  zRegisteredPermissionOffers,
);

/**
 * This is the registry of all registered permission capabilities offered by permissions provider snaps.
 * It is how the kernel encodes its knowledge of a permission.
 * The key is the snap host id.
 */
export type PermissionOfferRegistry = z.infer<typeof zPermissionOfferRegistry>;
