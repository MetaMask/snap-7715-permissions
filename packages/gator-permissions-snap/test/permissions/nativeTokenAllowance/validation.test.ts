import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { NativeTokenAllowancePermissionRequest } from '../../../src/permissions/nativeTokenAllowance/types';
import { parseAndValidatePermission } from '../../../src/permissions/nativeTokenAllowance/validation';
import { parseUnits } from '../../../src/utils/value';

const startTime = Math.floor(Date.now() / 1000) + 86400;
const expiryTimestamp = startTime + 86400 * 30;

const validPermissionRequest: NativeTokenAllowancePermissionRequest = {
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
    type: 'native-token-allowance',
    data: {
      allowanceAmount: bigIntToHex(
        parseUnits({ formatted: '1', decimals: 18 }),
      ),
      startTime,
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  },
};

describe('nativeTokenAllowance:validation', () => {
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
          type: 'native-token-periodic',
        },
      };

      expect(() =>
        parseAndValidatePermission(invalidTypeRequest as any),
      ).toThrow(
        'Failed type validation: type: Invalid literal value, expected "native-token-allowance"',
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

    it('should allow multiple payee addresses for native token allowances', () => {
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
      ).not.toThrow();
    });
  });
});
