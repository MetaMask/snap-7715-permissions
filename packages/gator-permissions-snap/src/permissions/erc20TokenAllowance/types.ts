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

export type Erc20TokenAllowanceMetadata = BaseMetadata & {
  validationErrors: {
    allowanceAmountError?: string;
    startTimeError?: string;
    expiryError?: string;
  };
};

export type Erc20TokenAllowanceContext = BaseContext & {
  permissionDetails: {
    allowanceAmount: string;
    startTime: number;
  };
};

export const zErc20TokenAllowancePermission = zPermission.extend({
  type: z.literal('erc20-token-allowance'),
  data: z.intersection(
    zMetaMaskPermissionData,
    z.object({
      allowanceAmount: zHexStr,
      startTime: zStartTime,
      tokenAddress: zAddressNotZeroAddress,
    }),
  ),
});

export type Erc20TokenAllowancePermission = z.infer<
  typeof zErc20TokenAllowancePermission
>;

export type Erc20TokenAllowancePermissionRequest =
  TypedPermissionRequest<Erc20TokenAllowancePermission>;

export type PopulatedErc20TokenAllowancePermission =
  DeepRequired<Erc20TokenAllowancePermission>;
