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
   * hex-encoding of uint256
   */
  chainId: zHexStr,

  /**
   * Account is part of 7715, but MetaMask will not require account to be passed in the request so is set to optional.
   * The permisssions picker UI will allow the user to select the account they want to use.
   */
  account: zAddress.optional(),

  /**
   * unix timestamp in seconds
   */
  expiry: z.number(),
  signer: zAccountSigner,
  permission: zPermission,
});
export const zPermissionsRequest = z.array(zPermissionRequest);

export type PermissionRequest = z.infer<typeof zPermissionRequest>;
export type PermissionsRequest = z.infer<typeof zPermissionsRequest>;
