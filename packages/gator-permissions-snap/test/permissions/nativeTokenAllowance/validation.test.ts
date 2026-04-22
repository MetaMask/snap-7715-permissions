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
  });
});
