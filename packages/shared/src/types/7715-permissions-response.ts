import { z } from 'zod';

import { zPermissionRequest } from './7715-permissions-request';
import { zAddress, zHexStr } from './common';

const zDependencyInfo = z.object({
  factory: zAddress,
  factoryData: zHexStr,
});

export type DependencyInfo = z.infer<typeof zDependencyInfo>;

export const zGrantedPermission = z.object({
  /**
   * Is a catch-all to identify a permission for revoking permissions or submitting
   * Defined in ERC-7679 and ERC-7710.
   */
  context: zHexStr,

  /**
   * The dependencyInfo is an array of objects, each containing fields for `factory` and `factoryData`
   * as defined in ERC-4337. Either both `factory` and `factoryData` must be specified in an entry, or neither.
   * This array is used describe accounts that are not yet deployed but MUST be deployed in order for a permission to be successfully redeemed.
   */
  dependencyInfo: z.array(zDependencyInfo),

  /**
   * Account to assign the permissions to and is dependent on the account type.
   */
  signerMeta: z.object({
    userOpBuilder: zAddress.optional(),

    delegationManager: zAddress.optional(),
  }),
});
export const zGrantedPermissions = z.array(zGrantedPermission);

export type GrantedPermission = z.infer<typeof zGrantedPermission>;
export type GrantedPermissions = z.infer<typeof zGrantedPermissions>;
/**
 * The response contains all of the parameters of the original request
 * and it is not guaranteed that the values received are equivalent to those requested.
 */
export const zPermissionResponse = z.intersection(
  zPermissionRequest,
  zGrantedPermission,
);
export const zPermissionsResponse = z.array(zPermissionResponse);

export type PermissionResponse = z.infer<typeof zPermissionResponse>;
export type PermissionsResponse = z.infer<typeof zPermissionsResponse>;
