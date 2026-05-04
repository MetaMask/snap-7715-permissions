import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
  zStartTime,
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
    startTimeError?: string;
    expiryError?: string;
  };
};

export type NativeTokenAllowanceContext = BaseContext & {
  permissionDetails: {
    allowanceAmount: string;
    startTime: number;
  };
};

export const zNativeTokenAllowancePermission = zPermission.extend({
  type: z.literal('native-token-allowance'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      allowanceAmount: zHexStr,
      startTime: zStartTime,
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
