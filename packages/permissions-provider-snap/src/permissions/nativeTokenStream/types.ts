import { z } from 'zod';
import {
  zHexStr,
  zPermission,
  zMetaMaskPermissionData,
} from '@metamask/7715-permissions-shared/types';
import { TypedPermissionRequest } from '../../core/types';
import { AccountDetailsProps } from '../../ui/components/AccountDetails';
import { BaseContext } from '../../core/types';

export type NativeTokenStreamMetadata = {
  validationErrors: {
    initialAmountError?: string;
    maxAmountError?: string;
    amountPerSecondError?: string;
    startTimeError?: string;
    expiryError?: string;
  };
};

export type NativeTokenStreamContext = BaseContext & {
  accountDetails: AccountDetailsProps;
  permissionDetails: {
    initialAmount: string;
    maxAmount: string;
    amountPerSecond: string;
    startTime: string;
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

type NativeTokenStreamData = NativeTokenStreamPermission['data'];

type ValidatedNativeTokenStreamData = {
  [K in keyof NativeTokenStreamData]-?: NonNullable<NativeTokenStreamData[K]>;
};

export type ValidatedNativeTokenStreamPermission =
  NativeTokenStreamPermission & {
    data: ValidatedNativeTokenStreamData;
  };

export type NativeTokenStreamPermissionRequest =
  TypedPermissionRequest<NativeTokenStreamPermission>;

export type ValidatedNativeTokenStreamPermissionRequest =
  TypedPermissionRequest<ValidatedNativeTokenStreamPermission> & {
    isAdjustmentAllowed: boolean;
  };
