import {
  zPermission,
  zMetaMaskPermissionData,
} from '@metamask/7715-permissions-shared/types';
import { z } from 'zod';

import type {
  DeepRequired,
  TypedPermissionRequest,
  BaseContext,
  BaseMetadata,
} from '../../core/types';
import type { MessageKey } from '../../utils/i18n';

export const TOKEN_APPROVAL_REVOCATION_PRIMITIVES = [
  {
    key: 'erc20Approve',
    labelKey: 'erc20ApproveRevocationLabel' satisfies MessageKey,
  },
  {
    key: 'erc721Approve',
    labelKey: 'erc721ApproveRevocationLabel' satisfies MessageKey,
  },
  {
    key: 'erc721SetApprovalForAll',
    labelKey: 'erc721SetApprovalForAllRevocationLabel' satisfies MessageKey,
  },
  {
    key: 'permit2Approve',
    labelKey: 'permit2ApproveRevocationLabel' satisfies MessageKey,
  },
  {
    key: 'permit2Lockdown',
    labelKey: 'permit2LockdownRevocationLabel' satisfies MessageKey,
  },
  {
    key: 'permit2InvalidateNonces',
    labelKey: 'permit2InvalidateNoncesRevocationLabel' satisfies MessageKey,
  },
] as const;

export type TokenApprovalRevocationPrimitiveKey =
  (typeof TOKEN_APPROVAL_REVOCATION_PRIMITIVES)[number]['key'];

export type TokenApprovalRevocationMechanisms = Record<
  TokenApprovalRevocationPrimitiveKey,
  boolean
>;

export type TokenApprovalRevocationMetadata = BaseMetadata & {
  validationErrors: {
    expiryError?: string;
  };
};

export type TokenApprovalRevocationContext = BaseContext & {
  approvalRevocationMechanisms: TokenApprovalRevocationMechanisms;
};

export const zTokenApprovalRevocationData = zMetaMaskPermissionData
  .extend({
    erc20Approve: z.boolean(),
    erc721Approve: z.boolean(),
    erc721SetApprovalForAll: z.boolean(),
    permit2Approve: z.boolean(),
    permit2Lockdown: z.boolean(),
    permit2InvalidateNonces: z.boolean(),
  })
  .refine(
    (data) => TOKEN_APPROVAL_REVOCATION_PRIMITIVES.some(({ key }) => data[key]),
    {
      message:
        'At least one token approval revocation mechanism must be enabled',
    },
  );

export const zTokenApprovalRevocationPermission = zPermission.extend({
  type: z.literal('token-approval-revocation'),
  data: zTokenApprovalRevocationData,
});

export type TokenApprovalRevocationPermission = z.infer<
  typeof zTokenApprovalRevocationPermission
>;

export type TokenApprovalRevocationPermissionRequest =
  TypedPermissionRequest<TokenApprovalRevocationPermission>;

export type PopulatedTokenApprovalRevocationPermission =
  DeepRequired<TokenApprovalRevocationPermission>;
