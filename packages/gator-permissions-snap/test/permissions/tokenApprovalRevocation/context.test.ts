import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  applyContext,
  buildContext,
  deriveMetadata,
  populatePermission,
} from '../../../src/permissions/tokenApprovalRevocation/context';
import type {
  TokenApprovalRevocationContext,
  TokenApprovalRevocationPermission,
  TokenApprovalRevocationPermissionRequest,
} from '../../../src/permissions/tokenApprovalRevocation/types';
import { createMockTokenMetadataCoordinator } from '../../testContext';

const ACCOUNT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

const approvalRevocationPrimitives = {
  erc20Approve: true,
  erc721Approve: true,
  erc721SetApprovalForAll: true,
  permit2Approve: true,
  permit2Lockdown: true,
  permit2InvalidateNonces: true,
};

const permission: TokenApprovalRevocationPermission = {
  type: 'token-approval-revocation',
  data: {
    justification: 'Permission to revoke approvals',
    ...approvalRevocationPrimitives,
  },
  isAdjustmentAllowed: true,
};

const permissionRequest: TokenApprovalRevocationPermissionRequest = {
  from: ACCOUNT_ADDRESS,
  chainId: '0x1',
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // +1 day
      },
    },
  ],
  to: '0x1',
  permission,
};

describe('tokenApprovalRevocation:context', () => {
  let mockTokenMetadataCoordinator: ReturnType<
    typeof createMockTokenMetadataCoordinator
  >;

  beforeEach(() => {
    mockTokenMetadataCoordinator = createMockTokenMetadataCoordinator();
  });

  describe('populatePermission()', () => {
    it('should return the permission unchanged', async () => {
      const populatedPermission = await populatePermission({ permission });
      expect(populatedPermission).toStrictEqual(permission);
    });
  });

  describe('buildContext()', () => {
    it('should create a context from a permission request', async () => {
      const context = await buildContext(permissionRequest, {
        tokenMetadataCoordinator: mockTokenMetadataCoordinator,
      });

      expect(context).toStrictEqual({
        expiry: {
          timestamp: permissionRequest.rules[0]?.data.timestamp,
        },
        justification: permission.data.justification,
        approvalRevocationPrimitives,
        isAdjustmentAllowed: true,
        accountAddressCaip10: `eip155:1:${ACCOUNT_ADDRESS}`,
      } satisfies TokenApprovalRevocationContext);
    });

    it('builds context without expiry when the expiry rule is not found', async () => {
      const request: TokenApprovalRevocationPermissionRequest = {
        ...permissionRequest,
        rules: [],
      };

      const context = await buildContext(request, {
        tokenMetadataCoordinator: mockTokenMetadataCoordinator,
      });
      expect(context.expiry).toBeUndefined();
    });

    it('throws an error if the address is missing', async () => {
      const request: TokenApprovalRevocationPermissionRequest = {
        ...permissionRequest,
        from: undefined as any,
      };

      await expect(
        buildContext(request, {
          tokenMetadataCoordinator: mockTokenMetadataCoordinator,
        }),
      ).rejects.toThrow(
        'PermissionRequest.address was not found. This should be resolved within the buildContextHandler function in PermissionHandler.',
      );
    });
  });

  describe('deriveMetadata()', () => {
    it('should create metadata without errors for a valid expiry', async () => {
      const context: TokenApprovalRevocationContext = {
        expiry: {
          timestamp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // +1 day
        },
        justification: 'Permission to revoke approvals',
        approvalRevocationPrimitives,
        isAdjustmentAllowed: true,
        accountAddressCaip10: `eip155:1:${ACCOUNT_ADDRESS}`,
      };

      const metadata = await deriveMetadata({ context });
      expect(metadata).toStrictEqual({
        validationErrors: {},
      });
    });

    it('should return a validation error for expiry in the past', async () => {
      const context: TokenApprovalRevocationContext = {
        expiry: {
          timestamp: 499161600, // 10/26/1985
        },
        justification: 'Permission to revoke approvals',
        approvalRevocationPrimitives,
        isAdjustmentAllowed: true,
        accountAddressCaip10: `eip155:1:${ACCOUNT_ADDRESS}`,
      };

      const metadata = await deriveMetadata({ context });
      expect(metadata.validationErrors).toStrictEqual({
        expiryError: 'Expiration date must be in the future',
      });
    });
  });

  describe('applyContext()', () => {
    it('should apply context changes to original request', async () => {
      const updatedExpiry = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // +30 days
      const context: TokenApprovalRevocationContext = {
        expiry: {
          timestamp: updatedExpiry,
        },
        justification: 'Permission to revoke approvals',
        approvalRevocationPrimitives,
        isAdjustmentAllowed: true,
        accountAddressCaip10: `eip155:1:${ACCOUNT_ADDRESS}`,
      };

      const result = await applyContext({
        context,
        originalRequest: permissionRequest,
      });

      expect(result.permission.type).toBe('token-approval-revocation');
      expect(result.permission.data.justification).toBe(
        permissionRequest.permission.data.justification,
      );
      expect(result.permission.data).toMatchObject(
        approvalRevocationPrimitives,
      );
      expect(result.permission.isAdjustmentAllowed).toBe(true);
      expect(result.from).toBe(ACCOUNT_ADDRESS);
      expect(
        result.rules.find((rule) => rule.type === 'expiry')?.data.timestamp,
      ).toBe(updatedExpiry);
    });

    it('adds an expiry rule if it is not in the original request', async () => {
      const context: TokenApprovalRevocationContext = {
        expiry: {
          timestamp: Math.floor(Date.now() / 1000) + 60,
        },
        justification: 'Permission to revoke approvals',
        approvalRevocationPrimitives,
        isAdjustmentAllowed: true,
        accountAddressCaip10: `eip155:1:${ACCOUNT_ADDRESS}`,
      };

      const originalRequestWithoutExpiry: TokenApprovalRevocationPermissionRequest =
        {
          ...permissionRequest,
          rules: [],
        };

      const result = await applyContext({
        context,
        originalRequest: originalRequestWithoutExpiry,
      });
      const expiryRule = result.rules.find((rule) => rule.type === 'expiry');
      expect(expiryRule).toBeDefined();
      expect(expiryRule?.data.timestamp).toBe(context.expiry?.timestamp);
    });
  });
});
