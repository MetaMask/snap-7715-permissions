import { z } from 'zod';

import { zPermissionRequest } from './7715-permissions-request';
import { zAddress, zHexStr } from './common';

const zAccountMeta = z.object({
  factory: zAddress,
  factoryData: zHexStr,
});

export type AccountMeta = z.infer<typeof zAccountMeta>;

export const zGrantedPermission = z.object({
  context: zHexStr,
  accountMeta: z.array(zAccountMeta).optional(),
  signerMeta: z.object({
    delegationManager: zAddress,
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
