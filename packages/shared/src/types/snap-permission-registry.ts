import { z } from 'zod';

import { zPermissionsRequest } from './7715-permissions-request';
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

  /**
   * Used to call the method on the permission provider snap.
   */
  id: z.string(),
});

/**
 * This is a local permissions offer definition by the permission's provider snaps.
 */
export type PermissionOffer = z.infer<typeof zPermissionOffer>;

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
   * An identifier used for identifying the specific permission defined by the permission provider snap.
   */
  hostPermissionId: z.string(),

  /**
   * Used to represent the permission to the user in the permissions picker UI.
   */
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
 * This is the registry of all registered permission capabilities offered by permissions provider snaps.
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
