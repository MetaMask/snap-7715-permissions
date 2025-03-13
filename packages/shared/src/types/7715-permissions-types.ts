import { any, z } from 'zod';

import { zAddress, zHexStr } from './common';

// Rather than only define permissions by name,
// Requestors can optionally make this an object and leave room for forward-extensibility.
export const zTypeDescriptor = z.union([
  z.string(),
  z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
]);
export type TypeDescriptor = z.infer<typeof zTypeDescriptor>;

export const zPermission = z.object({
  type: zTypeDescriptor,

  /**
   * Data structure varies by permission type.
   */
  data: z.record(any()),

  rules: z.record(any()).optional(),
});

export const zMetaMaskPermissionData = z.object({
  /**
   * A human-readable explanation of why the permission is being requested.
   */
  justification: z.string(),
});

export const zNativeTokenTransferPermission = zPermission.extend({
  type: z.literal('native-token-transfer'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      allowance: zHexStr,
    }),
  ),
});

export const zErc20TokenTransferPermission = zPermission.extend({
  type: z.literal('erc20-token-transfer'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      address: zAddress,
      allowance: zHexStr,
    }),
  ),
});

export const zErc721TokenTransferPermission = zPermission.extend({
  type: z.literal('erc721-token-transfer'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      address: zAddress,
      tokenIds: z.array(zHexStr),
    }),
  ),
});

export const zErc1155TokenTransferPermission = zPermission.extend({
  type: z.literal('erc1155-token-transfer'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      address: zAddress,
      allowances: z.record(zHexStr),
    }),
  ),
});

export const zNativeTokenStreamPermission = zPermission.extend({
  type: z.literal('native-token-stream'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      initialAmount: zHexStr.optional(),
      maxAmount: zHexStr,
      amountPerSecond: zHexStr,

      /**
       * Unix timestamp in seconds.
       */
      startTime: z.number(),
    }),
  ),
});

export type NativeTokenTransferPermission = z.infer<
  typeof zNativeTokenTransferPermission
>;
export type NativeTokenStreamPermission = z.infer<
  typeof zNativeTokenStreamPermission
>;
export type Erc20TokenTransferPermission = z.infer<
  typeof zErc20TokenTransferPermission
>;
export type Erc721TokenTransferPermission = z.infer<
  typeof zErc721TokenTransferPermission
>;
export type Erc1155TokenTransferPermission = z.infer<
  typeof zErc1155TokenTransferPermission
>;
export type Permission = z.infer<typeof zPermission>;
