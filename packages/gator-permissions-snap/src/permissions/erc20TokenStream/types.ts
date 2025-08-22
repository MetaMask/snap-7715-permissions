import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
  zAddress,
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

export type Erc20TokenStreamMetadata = BaseMetadata & {
  amountPerSecond: string;
  validationErrors: {
    initialAmountError?: string;
    maxAmountError?: string;
    amountPerPeriodError?: string;
    startTimeError?: string;
    expiryError?: string;
  };
};

export type Erc20TokenStreamContext = BaseContext & {
  permissionDetails: {
    initialAmount: string | null;
    maxAmount: string | null;
    timePeriod: TimePeriod;
    startTime: number;
    amountPerPeriod: string;
  };
};

export const zErc20TokenStreamPermission = zPermission.extend({
  type: z.literal('erc20-token-stream'),
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
      tokenAddress: zAddress,
    }),
  ),
});

export type Erc20TokenStreamPermission = z.infer<
  typeof zErc20TokenStreamPermission
>;

export type Erc20TokenStreamPermissionRequest =
  TypedPermissionRequest<Erc20TokenStreamPermission>;

export type PopulatedErc20TokenStreamPermission =
  DeepRequired<Erc20TokenStreamPermission>;
