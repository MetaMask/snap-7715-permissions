import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
} from '@metamask/7715-permissions-shared/types';
import { z } from 'zod';

import type {
  DeepRequired,
  TimePeriod,
  TypedPermissionRequest,
  BaseContext,
  BaseMetadata,
} from '../../core/types';
import { validateStartTimeZod } from '../../utils/validate';

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
    initialAmount: string | undefined | null;
    maxAmount: string | undefined | null;
    timePeriod: TimePeriod;
    startTime: string;
    amountPerPeriod: string;
  };
};

export const zNativeTokenStreamPermission = zPermission.extend({
  type: z.literal('native-token-stream'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      initialAmount: zHexStr.optional().nullable(),
      maxAmount: zHexStr.optional().nullable(),
      amountPerSecond: zHexStr,
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

export type NativeTokenStreamPermission = z.infer<
  typeof zNativeTokenStreamPermission
>;

export type NativeTokenStreamPermissionRequest =
  TypedPermissionRequest<NativeTokenStreamPermission>;

export type PopulatedNativeTokenStreamPermission =
  DeepRequired<NativeTokenStreamPermission>;
