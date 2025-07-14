import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
} from '@metamask/7715-permissions-shared/types';
import { z } from 'zod';

import type {
  DeepRequired,
  TypedPermissionRequest,
  BaseTokenPermissionContext,
  TimePeriod,
} from '../../core/types';

export type NativeTokenPeriodicMetadata = {
  validationErrors: {
    periodAmountError?: string;
    periodDurationError?: string;
    periodTypeError?: string;
    startTimeError?: string;
    expiryError?: string;
  };
};

export type NativeTokenPeriodicContext = BaseTokenPermissionContext & {
  permissionDetails: {
    periodAmount: string;
    periodType: TimePeriod | 'Other';
    periodDuration: string;
    startTime: string;
  };
};

export const zNativeTokenPeriodicPermission = zPermission.extend({
  type: z.literal('native-token-periodic'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      periodAmount: zHexStr,
      periodDuration: z.number().int().positive(),
      startTime: z.number().int().min(946684800, 'Start time must be after 2000-01-01'),
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
