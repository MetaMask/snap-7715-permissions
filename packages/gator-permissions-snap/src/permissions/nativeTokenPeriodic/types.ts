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
  TimePeriod,
} from '../../core/types';
import { validateStartTimeZod } from '../../utils/validate';

export type NativeTokenPeriodicMetadata = {
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
      startTime: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional()
        .refine(
          (value) => {
            if (value === undefined || value === null) {
              return true;
            }
            return validateStartTimeZod(value);
          },
          {
            message: 'Start time must be today or later',
          },
        ),
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
