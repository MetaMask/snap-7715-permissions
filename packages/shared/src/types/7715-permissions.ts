/* Onchain Permissions Standard Types (https://eip.tools/eip/7715)
 * Save Permissions Standard Types (https://github.com/MetaMask/ERCs/blob/wallet_savePermission/ERCS/eip-x.md)
 * 
 * This file is intended to define the types involved in the Onchain Permission Standard.
 * The types are defined as zod types, which can both export Typescript types, and be used as type validators.
 *
 * The zod types are prefixed with z, and the types are also exported.
*/

import { any, z } from 'zod';
import { zAddress, zHexStr, } from './common';

export const zAccountSigner = z.object({
  /**
   * Despite the 7715 support for 'key', 'wallet', 'keys' and 'account' type.
   * We're only supporting 'account' so that granted permissions
   * can enforce sophisticated policies that do not fit within 4337's constraints.
   * account = An account that can be granted with permissions as in ERC-7710.(i.e dapp session account).
   */
  type: z.enum(['account']),

  // ERC-7715 permission request.signer.data is type Record<string, any> so we can append MM specific data to dervie session accounts
  data: z.object({
    address: zAddress,
    siteSecretHash: zHexStr.optional(), // Dapp pass a secrect salt value that use to deterministic dervie entropy to create session account specific to their site
  }),
});
export type AccountSigner = z.infer<typeof zAccountSigner>;

export const zAccountSignerKeys = z.record(zAddress, zHexStr)

export type AccountSignerKeys = z.infer<typeof zAccountSignerKeys>;

// //////////////////////////// Permissions Request //////////////////////////////

// Rather than only define permissions by name,
// Requestors can optionally make this an object and leave room for forward-extensibility.
// We will default to using 'erc20-token-transfer' type for now as we move forward we can expand this.
export const zTypeDescriptor = z.union([
  z.enum(['native-token-transfer', 'erc20-token-transfer', 'erc721-token-transfer', 'erc1155-token-transfer']),
  z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
]);
export type TypeDescriptor = z.infer<typeof zTypeDescriptor>;


export const zMetaMaskPermissionData = z.object({
  // Signer is not part of ERC-7715, but gives us better multichain support when available.
  justification: z.string(),
  enforcedOutcome: z.record(any()).optional(),
  // Here is where we can add additional data for the permission, such as rquest for gas delegations.


  // Token data feilds
  address: zAddress.optional(),
  allowance: zHexStr.optional(),
  allowances: z.record(zHexStr).optional(),
  tokenIds: z.array(zHexStr).optional(),
})

export const zNativeTokenData = z.object({
  allowance: zHexStr,
})
export type NativeTokenData = z.infer<typeof zNativeTokenData>;

export const zErc20TokenData = z.object({
  address: zAddress,
  allowance: zHexStr,
})
export type Erc20TokenData = z.infer<typeof zErc20TokenData>;

export const zErc721TokenData = z.object({
  address: zAddress,
  tokenIds: z.array(zHexStr),
})
export type Erc721TokenData = z.infer<typeof zErc721TokenData>;

export const zErc1155TokenData = z.object({
  address: zAddress,
  allowances: z.record(zHexStr),
})
export type Erc1155TokenData = z.infer<typeof zErc1155TokenData>;

// Merge both permission request data types into a single type
export const zTokenPermissionData = z.union([zNativeTokenData, zErc20TokenData, zErc721TokenData, zErc1155TokenData]);
export const zCombinedPermissionData = z.intersection(zMetaMaskPermissionData, zTokenPermissionData);

export const zPermission = z.object({
  type: zTypeDescriptor,
  data: zCombinedPermissionData,
})
export type Permission = z.infer<typeof zPermission>;

export const zPermissionRequest = z.object({
  chainId: zHexStr, // hex-encoding of uint256

  /**
   * Account is part of 7715, but MetaMask Web wallet we do no require account to be passed in the request.
   *   - Wallet does not have a connect where we expose the accounts
   *   - Permission request is the first interaction with the wallet
   *   - Wallet permission picker will allow user to select the targeted account.
   *   - The selected target account is attached to the original permssion in the grant response request if the user grants the permission.
  */
  account: zAddress.optional(),
  expiry: z.number(), // unix timestamp
  signer: zAccountSigner,
  permission: zPermission,
});
export const zPermissionsRequest = z.array(zPermissionRequest);

export type PermissionRequest = z.infer<typeof zPermissionRequest>;
export type PermissionsRequest = z.infer<typeof zPermissionsRequest>;

export const zPermissionRequestParam = z.object({
  chainId: zHexStr, // hex-encoding of uint256
  expiry: z.number(), // unix timestamp
  permission: zPermission,
});

export const zPermissionsRequestParam = z.array(zPermissionRequestParam);

const zSignerOptionASchema = z.object({
  address: zAddress,
});

const zSignerOptionBSchema = z.object({
  siteSecret: z.string(),
});

export const zSignerOptions = zSignerOptionASchema.or(zSignerOptionBSchema);

/**
 * SignerOption is a union of two types: Is a type abstraction that sits above the ERC-7715(PermissionRequest, PermissionsRequest) type
 * so dapps can choose to use their own session account or a deterministic session account provided by the wallet.
 */
export type SignerOption = z.infer<typeof zSignerOptions>;

/**
 * A type abstraction that sits above the ERC-7715(PermissionRequest) type
 * so consumers of permissions-connector can focus on composing their permissions.
 */
export type PermissionRequestParam = z.infer<typeof zPermissionRequestParam>;

/**
 * A type abstraction that sits above the ERC-7715(PermissionsRequest) type
 * so consumers of permissions-connector can focus on composing their permissions.
 */
export type PermissionsRequestParam = z.infer<typeof zPermissionsRequestParam>;

// //////////////////////////// Permissions Response //////////////////////////////

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


// Note that the response contains all of the parameters of the original request
// and it is not guaranteed that the values received are equivalent to those requested.
export const zPermissionResponse = z.intersection(zPermissionRequest, zGrantedPermission);
export const zPermissionsResponse = z.array(zPermissionResponse);

export type PermissionResponse = z.infer<typeof zPermissionResponse>;
export type PermissionsResponse = z.infer<typeof zPermissionsResponse>;
