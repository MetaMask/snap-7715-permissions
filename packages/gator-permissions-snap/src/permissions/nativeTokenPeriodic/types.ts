import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
} from '@metamask/7715-permissions-shared/types';
import type { Hex } from 'viem';
import { z } from 'zod';

import type {
  DeepRequired,
  TypedPermissionRequest,
  BaseContext,
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

export type NativeTokenPeriodicContext = BaseContext & {
  accountDetails: {
    address: Hex;
    balanceFormattedAsCurrency: string;
    balance: string;
    symbol: string;
  };
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
      periodDuration: z.number(),
      startTime: z.number(),
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
