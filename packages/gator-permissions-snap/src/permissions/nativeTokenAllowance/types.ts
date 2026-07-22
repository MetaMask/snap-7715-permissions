import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
} from '@metamask/7715-permissions-shared/types';
import { z } from 'zod';

import type {
  DeepRequired,
  TypedPermissionRequest,
  BaseContext,
  BaseMetadata,
} from '../../core/types';

export type NativeTokenAllowanceMetadata = BaseMetadata & {
  validationErrors: {
    allowanceAmountError?: string;
    expiryError?: string;
  };
};

export type NativeTokenAllowanceContext = BaseContext & {
  permissionDetails: {
    allowanceAmount: string;
  };
};

export const zNativeTokenAllowancePermission = zPermission.extend({
  type: z.literal('native-token-allowance'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      allowanceAmount: zHexStr,
    }),
  ),
});

export type NativeTokenAllowancePermission = z.infer<
  typeof zNativeTokenAllowancePermission
>;

export type NativeTokenAllowancePermissionRequest =
  TypedPermissionRequest<NativeTokenAllowancePermission>;

export type PopulatedNativeTokenAllowancePermission =
  DeepRequired<NativeTokenAllowancePermission>;
