import { describe, expect, it } from '@jest/globals';

import type { TokenApprovalRevocationPermissionRequest } from '../../../src/permissions/tokenApprovalRevocation/types';
import { parseAndValidatePermission } from '../../../src/permissions/tokenApprovalRevocation/validation';

const REVOCATION_MECHANISMS = {
  erc20Approve: true,
  erc721Approve: true,
  erc721SetApprovalForAll: true,
  permit2Approve: true,
  permit2Lockdown: true,
  permit2InvalidateNonces: true,
};

const validPermissionRequest: TokenApprovalRevocationPermissionRequest = {
  chainId: '0x1',
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
      },
    },
  ],
  to: '0x1',
  permission: {
    type: 'token-approval-revocation',
    data: {
      justification: 'test',
      ...REVOCATION_MECHANISMS,
    },
    isAdjustmentAllowed: true,
  },
};

describe('tokenApprovalRevocation:validation', () => {
  describe('parseAndValidatePermission()', () => {
    it('should validate a valid permission request', () => {
      expect(() =>
        parseAndValidatePermission(validPermissionRequest),
      ).not.toThrow();

      const result = parseAndValidatePermission(validPermissionRequest);
      expect(result).toStrictEqual(validPermissionRequest);
    });

    it('allows missing expiry', () => {
      const missingExpiryRequest = {
        ...validPermissionRequest,
        rules: [],
      };

      expect(() =>
        parseAndValidatePermission(missingExpiryRequest as any),
      ).not.toThrow();
    });

    it('should throw for invalid permission type', () => {
      const invalidTypeRequest = {
        ...validPermissionRequest,
        permission: {
          ...validPermissionRequest.permission,
          type: 'invalid-type',
        },
      };

      expect(() =>
        parseAndValidatePermission(invalidTypeRequest as any),
      ).toThrow(
        'Failed type validation: type: Invalid literal value, expected "token-approval-revocation"',
      );
    });

    it('should require isAdjustmentAllowed to be a boolean', () => {
      const requestWithoutAdjustmentFlag = {
        ...validPermissionRequest,
        permission: {
          ...validPermissionRequest.permission,
          isAdjustmentAllowed: undefined,
        },
      } as any;

      expect(() =>
        parseAndValidatePermission(requestWithoutAdjustmentFlag),
      ).toThrow('Failed type validation: isAdjustmentAllowed: Required');
    });

    it('should require at least one revocation mechanism', () => {
      const requestWithoutMechanisms = {
        ...validPermissionRequest,
        permission: {
          ...validPermissionRequest.permission,
          data: {
            ...validPermissionRequest.permission.data,
            erc20Approve: false,
            erc721Approve: false,
            erc721SetApprovalForAll: false,
            permit2Approve: false,
            permit2Lockdown: false,
            permit2InvalidateNonces: false,
          },
        },
      };

      expect(() =>
        parseAndValidatePermission(requestWithoutMechanisms),
      ).toThrow(
        'At least one token approval revocation mechanism must be enabled',
      );
    });
  });
});
