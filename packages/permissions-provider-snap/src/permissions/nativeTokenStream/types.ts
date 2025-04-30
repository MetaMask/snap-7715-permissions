import { z } from 'zod';
import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
} from '@metamask/7715-permissions-shared/types';
import {
  HydratedPermissionRequest,
  TypedPermissionRequest,
} from '../../core/types';
import { AccountDetailsProps } from '../../ui/components/AccountDetails';
import { BaseContext } from '../../core/types';

export type NativeTokenStreamMetadata = {
  amountPerSecond: string;
  validationErrors: {
    initialAmountError?: string;
    maxAmountError?: string;
    amountPerPeriodError?: string;
    startTimeError?: string;
    expiryError?: string;
  };
};

/**
 * An enum representing the time periods for which the stream rate can be calculated.
 */
export enum TimePeriod {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
}

export type NativeTokenStreamContext = BaseContext & {
  accountDetails: AccountDetailsProps;
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

export type HydratedNativeTokenStreamPermissionRequest =
  HydratedPermissionRequest<NativeTokenStreamPermissionRequest>;
