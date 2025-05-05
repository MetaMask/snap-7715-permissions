import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
} from '@metamask/7715-permissions-shared/types';
import { type Hex } from 'viem';
import { z } from 'zod';

import type {
  DeepRequired,
  TimePeriod,
  TypedPermissionRequest,
  BaseContext,
} from '../../core/types';

export type NativeTokenStreamMetadata = {
  amountPerSecond: string;
  validationErrors: {
    initialAmountError?: string;
    maxAmountError?: string;
    amountPerPeriodError?: string;
    startTimeError?: string;
    expiryError?: string;
  };
  rulesToAdd: string[];
};

export type NativeTokenStreamContext = BaseContext & {
  accountDetails: {
    address: Hex;
    balanceFormattedAsCurrency: string;
    balance: string;
  };
  permissionDetails: {
    initialAmount: string | undefined;
    maxAmount: string | undefined;
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
      initialAmount: zHexStr.optional(),
      maxAmount: zHexStr.optional(),
      amountPerSecond: zHexStr,
      startTime: z.number(),
    }),
  ),
});

export type NativeTokenStreamPermission = z.infer<
  typeof zNativeTokenStreamPermission
>;

export type NativeTokenStreamPermissionRequest =
  TypedPermissionRequest<NativeTokenStreamPermission>;

export type HydratedNativeTokenStreamPermission =
  DeepRequired<NativeTokenStreamPermission>;
