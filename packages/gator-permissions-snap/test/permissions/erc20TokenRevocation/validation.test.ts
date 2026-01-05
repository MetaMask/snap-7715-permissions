import { describe, expect, it } from '@jest/globals';

import type { Erc20TokenRevocationPermissionRequest } from '../../../src/permissions/erc20TokenRevocation/types';
import { parseAndValidatePermission } from '../../../src/permissions/erc20TokenRevocation/validation';

const validPermissionRequest: Erc20TokenRevocationPermissionRequest = {
  chainId: '0x1',
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
      },
      isAdjustmentAllowed: true,
    },
  ],
  signer: {
    type: 'account',
    data: {
      address: '0x1',
    },
  },
  permission: {
    type: 'erc20-token-revocation',
    data: {
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  },
};

describe('erc20TokenRevocation:validation', () => {
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
        'Failed type validation: type: Invalid literal value, expected "erc20-token-revocation"',
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
  });
});
