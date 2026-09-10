import {
  zAddress,
  zAddressNotZeroAddress,
  zHexStr,
  zMetaMaskPermissionData,
  zPermission,
} from '@metamask/7715-permissions-shared/types';
import type { Hex } from '@metamask/delegation-core';
import type { CaipAssetType } from '@metamask/snaps-sdk';
import { z } from 'zod';

import {
  isFourByteSelector,
  isFunctionSignature,
  normalizeSelector,
} from './selectors';
import type {
  BaseContext,
  BaseMetadata,
  DeepRequired,
  TypedPermissionRequest,
} from '../../core/types';

/**
 * Upper bound on allow-listed contracts, to keep the confirmation readable.
 */
export const MAX_TARGETS = 5;

/**
 * Upper bound on allow-listed function selectors, to keep the confirmation readable.
 */
export const MAX_SELECTORS = 8;

export type Erc20TokenSwapMetadata = BaseMetadata & {
  validationErrors: {
    maxSpendAmountError?: string;
    minReceiveAmountError?: string;
    expiryError?: string;
  };
};

/**
 * Context for the ERC-20 token swap confirmation.
 *
 * The `BaseContext` token slot holds the token being spent, so the shell shows
 * the balance of the position the user is protecting. The token being received
 * is tracked separately.
 */
export type Erc20TokenSwapContext = BaseContext & {
  permissionDetails: {
    maxSpendAmount: string;
    minReceiveAmount: string;
    targets: Hex[];
    selectors: string[];
  };
  receiveTokenAddressCaip19: CaipAssetType;
  receiveTokenMetadata: BaseContext['tokenMetadata'];
};

const zSelector = z
  .string()
  .refine((value) => isFourByteSelector(value) || isFunctionSignature(value), {
    message:
      'Invalid selector: must be a 4-byte hex selector or an ABI function signature',
  });

export const zErc20TokenSwapData = zMetaMaskPermissionData
  .extend({
    spend: z.object({
      tokenAddress: zAddressNotZeroAddress,
      maxAmount: zHexStr,
    }),
    receive: z.object({
      tokenAddress: zAddressNotZeroAddress,
      minAmount: zHexStr,
    }),
    via: z.object({
      targets: z.array(zAddressNotZeroAddress).min(1).max(MAX_TARGETS),
      selectors: z.array(zSelector).min(1).max(MAX_SELECTORS),
    }),
    /**
     * The account that must receive the swapped tokens. Always the granting
     * account; the wallet populates it, and a dApp-supplied value must match.
     */
    recipient: zAddress.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.spend.tokenAddress === data.receive.tokenAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receive', 'tokenAddress'],
        message:
          'Invalid receive.tokenAddress: must differ from spend.tokenAddress',
      });
    }

    if (new Set(data.via.targets).size !== data.via.targets.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['via', 'targets'],
        message: 'Invalid via.targets: must not contain duplicates',
      });
    }

    const normalizedSelectors = data.via.selectors.map(normalizeSelector);
    if (new Set(normalizedSelectors).size !== normalizedSelectors.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['via', 'selectors'],
        message: 'Invalid via.selectors: must not contain duplicates',
      });
    }
  });

export const zErc20TokenSwapPermission = zPermission.extend({
  type: z.literal('erc20-token-swap'),
  data: zErc20TokenSwapData,
});

export type Erc20TokenSwapPermission = z.infer<
  typeof zErc20TokenSwapPermission
>;

export type Erc20TokenSwapPermissionRequest =
  TypedPermissionRequest<Erc20TokenSwapPermission>;

export type PopulatedErc20TokenSwapPermission =
  DeepRequired<Erc20TokenSwapPermission>;
