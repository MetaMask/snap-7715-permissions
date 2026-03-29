import {
  zPermission,
  zMetaMaskPermissionData,
  zHexStr,
} from '@metamask/7715-permissions-shared/types';
import { z } from 'zod';

import type {
  DeepRequired,
  TypedPermissionRequest,
  BaseContext,
  BaseMetadata,
} from '../../core/types';

export type NativeTokenSwapMetadata = BaseMetadata & {
  validationErrors: {
    maxNativeSwapAmountError?: string;
    expiryError?: string;
  };
};

export type NativeTokenSwapContext = BaseContext & {
  permissionDetails: {
    /** Human-readable max allowance for the swap cap (native token units). */
    maxSwapAmount: string;
    whitelistedTokensOnly: boolean;
  };
};

export const zNativeTokenSwapPermission = zPermission.extend({
  type: z.literal('native-token-swap'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      maxNativeSwapAmount: zHexStr,
      whitelistedTokensOnly: z.boolean(),
    }),
  ),
});

export type NativeTokenSwapPermission = z.infer<typeof zNativeTokenSwapPermission>;

export type NativeTokenSwapPermissionRequest =
  TypedPermissionRequest<NativeTokenSwapPermission>;

export type PopulatedNativeTokenSwapPermission =
  DeepRequired<NativeTokenSwapPermission>;
