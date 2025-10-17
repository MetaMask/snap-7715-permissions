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
  TimePeriod,
  BaseMetadata,
} from '../../core/types';
import { zPeriodDuration } from '../../utils/time';

export type NativeTokenPeriodicMetadata = BaseMetadata & {
  validationErrors: {
    periodAmountError?: string;
    periodDurationError?: string;
    periodTypeError?: string;
    startTimeError?: string;
    expiryError?: string;
  };
};

export type NativeTokenPeriodicContext = BaseContext & {
  permissionDetails: {
    periodAmount: string;
    periodType: TimePeriod;
    periodDuration: string;
    startTime: number;
  };
};

export const zNativeTokenPeriodicPermission = zPermission.extend({
  type: z.literal('native-token-periodic'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      periodAmount: zHexStr,
      periodDuration: zPeriodDuration,
      startTime: zStartTime,
    }),
  ),
});

export type NativeTokenPeriodicPermission = z.infer<
  typeof zNativeTokenPeriodicPermission
>;

export type NativeTokenPeriodicPermissionRequest =
  TypedPermissionRequest<NativeTokenPeriodicPermission>;

export type PopulatedNativeTokenPeriodicPermission =
  DeepRequired<NativeTokenPeriodicPermission>;
