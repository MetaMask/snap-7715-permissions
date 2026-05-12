import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { Erc20TokenAllowancePermissionRequest } from '../../../src/permissions/erc20TokenAllowance/types';
import { parseAndValidatePermission } from '../../../src/permissions/erc20TokenAllowance/validation';
import { parseUnits } from '../../../src/utils/value';

const tokenDecimals = 6;

const startTime = Math.floor(Date.now() / 1000) + 86400;
const expiryTimestamp = startTime + 86400 * 30;

const validPermissionRequest: Erc20TokenAllowancePermissionRequest = {
  chainId: '0x1',
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: expiryTimestamp,
      },
    },
  ],
  to: '0x1',
  permission: {
    type: 'erc20-token-allowance',
    data: {
      allowanceAmount: bigIntToHex(
        parseUnits({ formatted: '100', decimals: tokenDecimals }),
      ),
      startTime,
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  },
};

describe('erc20TokenAllowance:validation', () => {
  describe('parseAndValidatePermission()', () => {
    it('should validate a valid permission request', () => {
      expect(() =>
        parseAndValidatePermission(validPermissionRequest),
      ).not.toThrow();
      expect(parseAndValidatePermission(validPermissionRequest)).toStrictEqual(
        validPermissionRequest,
      );
    });

    it('allows a missing expiry rule like other permissions', () => {
      const missingExpiry = {
        ...validPermissionRequest,
        rules: [],
      };

      expect(() =>
        parseAndValidatePermission(missingExpiry as any),
      ).not.toThrow();
    });

    it('should throw for invalid permission type', () => {
      const invalidTypeRequest = {
        ...validPermissionRequest,
        permission: {
          ...validPermissionRequest.permission,
          type: 'erc20-token-periodic',
        },
      };

      expect(() =>
        parseAndValidatePermission(invalidTypeRequest as any),
      ).toThrow(
        'Failed type validation: type: Invalid literal value, expected "erc20-token-allowance"',
      );
    });

    it('should throw for zero allowanceAmount', () => {
      const zeroRequest = {
        ...validPermissionRequest,
        permission: {
          ...validPermissionRequest.permission,
          data: {
            ...validPermissionRequest.permission.data,
            allowanceAmount: '0x0' as `0x${string}`,
          },
        },
      };

      expect(() => parseAndValidatePermission(zeroRequest)).toThrow(
        'Invalid allowanceAmount: must be greater than 0',
      );
    });

    it('should throw when redeemer rule has no addresses', () => {
      const invalidRedeemerRuleRequest = {
        ...validPermissionRequest,
        rules: [
          ...(validPermissionRequest.rules ?? []),
          {
            type: 'redeemer',
            data: {
              addresses: [],
            },
          },
        ],
      };

      expect(() =>
        parseAndValidatePermission(invalidRedeemerRuleRequest as any),
      ).toThrow(
        'Invalid redeemer rule: must include a non-empty addresses array',
      );
    });

    it('should throw when payee rule has no addresses', () => {
      const invalidPayeeRuleRequest = {
        ...validPermissionRequest,
        rules: [
          ...(validPermissionRequest.rules ?? []),
          {
            type: 'payee',
            data: {
              addresses: [],
            },
          },
        ],
      };

      expect(() =>
        parseAndValidatePermission(invalidPayeeRuleRequest as any),
      ).toThrow('Invalid payee rule: must include a non-empty addresses array');
    });

    it('should throw when payee rule has multiple addresses', () => {
      const multiplePayeesRequest = {
        ...validPermissionRequest,
        rules: [
          ...(validPermissionRequest.rules ?? []),
          {
            type: 'payee',
            data: {
              addresses: [
                '0x1111111111111111111111111111111111111111',
                '0x2222222222222222222222222222222222222222',
              ],
            },
          },
        ],
      };

      expect(() =>
        parseAndValidatePermission(multiplePayeesRequest as any),
      ).toThrow(
        'Multiple payee addresses are not currently supported for ERC20 permissions.',
      );
    });
  });
});
