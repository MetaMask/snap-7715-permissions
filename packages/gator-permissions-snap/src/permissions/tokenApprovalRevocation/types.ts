import {
  zPermission,
  zMetaMaskPermissionData,
} from '@metamask/7715-permissions-shared/types';
import { z } from 'zod';

import { hasTokenApprovalRevocationMechanism } from './primitives';
import type { TokenApprovalRevocationMechanisms } from './primitives';
import type {
  DeepRequired,
  TypedPermissionRequest,
  BaseContext,
  BaseMetadata,
} from '../../core/types';

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
  .refine(hasTokenApprovalRevocationMechanism, {
    message: 'At least one token approval revocation mechanism must be enabled',
  });

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
