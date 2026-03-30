import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import { getNativeTokenSwapSupportedChainIds } from '../../../src/core/chainMetadata';
import type { NativeTokenSwapPermissionRequest } from '../../../src/permissions/nativeTokenSwap/types';
import {
  getSupportedChains,
  parseAndValidatePermission,
} from '../../../src/permissions/nativeTokenSwap/validation';
import { parseUnits } from '../../../src/utils/value';

const validPermissionRequest: NativeTokenSwapPermissionRequest = {
  chainId: '0x1',
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: Math.floor(Date.now() / 1000) + 86400 * 7,
      },
    },
  ],
  to: '0x1',
  permission: {
    type: 'native-token-swap',
    data: {
      justification: 'test',
      maxNativeSwapAmount: bigIntToHex(
        parseUnits({ formatted: '1', decimals: 18 }),
      ),
      whitelistedTokensOnly: true,
    },
    isAdjustmentAllowed: true,
  },
};

describe('nativeTokenSwap:validation', () => {
  describe('getSupportedChains()', () => {
    it('returns sorted chain IDs with a deployed swap adapter', () => {
      expect(getSupportedChains()).toStrictEqual(
        getNativeTokenSwapSupportedChainIds(),
      );
    });
  });

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
        'Failed type validation: type: Invalid literal value, expected "native-token-swap"',
      );
    });

    it('should reject zero maxNativeSwapAmount', () => {
      const zeroAmount = {
        ...validPermissionRequest,
        permission: {
          ...validPermissionRequest.permission,
          data: {
            ...validPermissionRequest.permission.data,
            maxNativeSwapAmount: '0x0',
          },
        },
      };

      expect(() => parseAndValidatePermission(zeroAmount as any)).toThrow(
        'Invalid maxNativeSwapAmount: must be greater than 0',
      );
    });
  });
});
