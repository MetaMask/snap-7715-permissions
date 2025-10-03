import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
  zStartTime,
  zHexStrNullableOptional,
} from '@metamask/7715-permissions-shared/types';
import { z } from 'zod';

import type {
  DeepRequired,
  TimePeriod,
  TypedPermissionRequest,
  BaseContext,
  BaseMetadata,
} from '../../core/types';

export type NativeTokenStreamMetadata = BaseMetadata & {
  amountPerSecond: string;
  validationErrors: {
    initialAmountError?: string;
    maxAmountError?: string;
    amountPerPeriodError?: string;
    startTimeError?: string;
    expiryError?: string;
  };
};

export type NativeTokenStreamContext = BaseContext & {
  permissionDetails: {
    initialAmount: string | null;
    maxAmount: string | null;
    timePeriod: TimePeriod;
    startTime: number;
    amountPerPeriod: string;
  };
};

export const zNativeTokenStreamPermission = zPermission.extend({
  type: z.literal('native-token-stream'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      initialAmount: zHexStrNullableOptional,
      maxAmount: zHexStrNullableOptional,
      amountPerSecond: zHexStr,
      startTime: zStartTime,
    }),
  ),
});

export type NativeTokenStreamPermission = z.infer<
  typeof zNativeTokenStreamPermission
>;

export type NativeTokenStreamPermissionRequest =
  TypedPermissionRequest<NativeTokenStreamPermission>;

export type PopulatedNativeTokenStreamPermission =
  DeepRequired<NativeTokenStreamPermission>;
