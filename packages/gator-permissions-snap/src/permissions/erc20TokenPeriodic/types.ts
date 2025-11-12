import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
  zStartTime,
  zAddressNotZeroAddress,
} from '@metamask/7715-permissions-shared/types';
import { z } from 'zod';

import type {
  DeepRequired,
  TypedPermissionRequest,
  BaseContext,
  BaseMetadata,
} from '../../core/types';
import { zPeriodDuration } from '../../utils/time';

export type Erc20TokenPeriodicMetadata = BaseMetadata & {
  validationErrors: {
    periodAmountError?: string;
    periodDurationError?: string;
    startTimeError?: string;
    expiryError?: string;
  };
};

export type Erc20TokenPeriodicContext = BaseContext & {
  permissionDetails: {
    periodAmount: string;
    periodDuration: number;
    startTime: number;
  };
};

export const zErc20TokenPeriodicPermission = zPermission.extend({
  type: z.literal('erc20-token-periodic'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      periodAmount: zHexStr,
      periodDuration: zPeriodDuration,
      startTime: zStartTime,
      tokenAddress: zAddressNotZeroAddress,
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
