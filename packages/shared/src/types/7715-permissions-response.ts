import { z } from 'zod';

import { zPermissionRequest } from './7715-permissions-request';
import { zAddress, zHexStr } from './common';

const zAccountMeta = z.object({
  factory: zAddress,
  factoryData: zHexStr,
});

export type AccountMeta = z.infer<typeof zAccountMeta>;

export const zGrantedPermission = z.object({
  /**
   * Is a catch-all to identify a permission for revoking permissions or submitting
   * Defined in ERC-7679 and ERC-7710.
   */
  context: zHexStr,

  /**
   * The accountMeta field is required and contains information needed to deploy accounts.
   * Each entry specifies a factory contract and its associated deployment data.
   * If no account deployment is needed when redeeming the permission, this array must be empty.
   * When non-empty, DApps MUST deploy the accounts by calling the factory contract with factoryData as the calldata.
   * Defined in ERC-4337.
   */
  accountMeta: z.array(zAccountMeta),

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
