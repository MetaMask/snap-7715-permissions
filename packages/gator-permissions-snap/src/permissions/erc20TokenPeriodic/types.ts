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

export type Erc20TokenPeriodicMetadata = {
  validationErrors: {
    periodAmountError?: string;
    periodDurationError?: string;
    periodTypeError?: string;
    startTimeError?: string;
    expiryError?: string;
  };
};

export type Erc20TokenPeriodicContext = BaseContext & {
  permissionDetails: {
    periodAmount: string;
    periodType: TimePeriod | 'Other';
    periodDuration: string;
    startTime: string;
  };
};

export const zErc20TokenPeriodicPermission = zPermission.extend({
  type: z.literal('erc20-token-periodic'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      periodAmount: zHexStr,
      periodDuration: z.number(),
      startTime: z.number(),
      tokenAddress: zHexStr,
    }),
  ),
});

export type Erc20TokenPeriodicPermission = z.infer<
  typeof zErc20TokenPeriodicPermission
>;

export type Erc20TokenPeriodicPermissionRequest =
  TypedPermissionRequest<Erc20TokenPeriodicPermission>;

export type PopulatedErc20TokenPeriodicPermission =
  DeepRequired<Erc20TokenPeriodicPermission>;
