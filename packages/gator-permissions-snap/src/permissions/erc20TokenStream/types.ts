import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
} from '@metamask/7715-permissions-shared/types';
import type { Hex } from 'viem';
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
  accountDetails: {
    address: Hex;
    balanceFormattedAsCurrency: string;
    balance: Hex;
  };
  tokenMetadata: {
    decimals: number;
    symbol: string;
  };
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
      startTime: z.number(),
      tokenAddress: zHexStr,
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
