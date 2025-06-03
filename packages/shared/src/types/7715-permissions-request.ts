import { z } from 'zod';

import { zPermission } from './7715-permissions-types';
import { zAddress, zHexStr } from './common';

export const zAccountSigner = z.object({
  type: z.literal('account'),
  data: z.object({
    address: zAddress,
  }),
});

/**
 * An account that can be granted with permissions as in ERC-7710.
 */
export type AccountSigner = z.infer<typeof zAccountSigner>;

export const zWalletSigner = z.object({
  type: z.literal('wallet'),
  data: z.object({}),
});

/**
 * A wallet is the signer for these permissions
 * `data` is not necessary for this signer type as the wallet is both the signer and grantor of these permissions.
 */
export type WalletSigner = z.infer<typeof zAccountSigner>;

export const zPermissionRequest = z.object({
  /**
   * hex-encoding of uint256 defined the chain with EIP-155
   */
  chainId: zHexStr,

  /**
   *
   * The account being targeted for this permission request.
   * It is optional to let the user choose which account to grant permission for.
   */
  address: zAddress.optional(),

  /**
   * unix timestamp in seconds
   */
  expiry: z.number(),

  /**
   * Whether the permission can be adjusted
   */
  isAdjustmentAllowed: z.boolean().optional(),

  /**
   * An account that can be granted with permissions as in ERC-7710
   */
  signer: zAccountSigner,

  /**
   * Defines the allowed behavior the signer can do on behalf of the account.
   */
  permission: zPermission,
});
export const zPermissionsRequest = z.array(zPermissionRequest);

export type PermissionRequest = z.infer<typeof zPermissionRequest>;
export type PermissionsRequest = z.infer<typeof zPermissionsRequest>;

export const zGrantAttenuatedPermissionsParams = z.object({
  permissionsRequest: zPermissionsRequest,
  siteOrigin: z.string(),
});

/**
 * This is the parameters for the grantAttenuatedPermissions method.
 * It is used by the kernel to forward request to permission provider snaps.
 */
export type GrantAttenuatedPermissionsParams = z.infer<
  typeof zGrantAttenuatedPermissionsParams
>;
