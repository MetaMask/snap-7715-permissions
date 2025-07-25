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
} from '../../core/types';

export type Erc20TokenStreamMetadata = {
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
    initialAmount: string | undefined;
    maxAmount: string | undefined;
    timePeriod: TimePeriod;
    startTime: string;
    amountPerPeriod: string;
  };
};

export const zErc20TokenStreamPermission = zPermission.extend({
  type: z.literal('erc20-token-stream'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      initialAmount: zHexStr.optional(),
      maxAmount: zHexStr.optional(),
      amountPerSecond: zHexStr,
      startTime: z.number().int().min(946684800, 'Start time must be after 2000-01-01'),
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
