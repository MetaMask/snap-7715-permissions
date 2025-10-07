import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
  zAddress,
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
      initialAmount: zHexStrNullableOptional,
      maxAmount: zHexStrNullableOptional,
      amountPerSecond: zHexStr,
      startTime: zStartTime,
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
