import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { NativeTokenStreamPermissionRequest } from '../../../src/permissions/nativeTokenStream/types';
import { parseAndValidatePermission } from '../../../src/permissions/nativeTokenStream/validation';
import { convertReadableDateToTimestamp } from '../../../src/utils/time';
import { parseUnits } from '../../../src/utils/value';

const validPermissionRequest: NativeTokenStreamPermissionRequest = {
  chainId: '0x1',
  expiry: convertReadableDateToTimestamp('05/01/2024'),
  isAdjustmentAllowed: true,
  signer: {
    type: 'account',
    data: {
      address: '0x1',
    },
  },
  permission: {
    type: 'native-token-stream',
    data: {
      initialAmount: bigIntToHex(parseUnits({ formatted: '1', decimals: 18 })), // 1 ETH
      maxAmount: bigIntToHex(parseUnits({ formatted: '10', decimals: 18 })), // 10 ETH
      amountPerSecond: bigIntToHex(
        parseUnits({ formatted: '.5', decimals: 18 }),
      ), // 0.5 ETH per second
      startTime: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
      justification: 'test',
    },
    rules: {},
  },
};

describe('nativeTokenStream:validation', () => {
  describe('parseAndValidatePermission()', () => {
    it('should validate a valid permission request', () => {
      expect(() =>
        parseAndValidatePermission(validPermissionRequest),
      ).not.toThrow();

      const result = parseAndValidatePermission(validPermissionRequest);
      expect(result).toStrictEqual(validPermissionRequest);
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
        'Failed type validation: type: Invalid literal value, expected "native-token-stream"',
      );
    });

    describe('maxAmount validation', () => {
      it('should throw for zero maxAmount', () => {
        const zeroMaxAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              maxAmount: '0x0' as `0x${string}`,
            },
          },
        };

        expect(() => parseAndValidatePermission(zeroMaxAmountRequest)).toThrow(
          'Invalid maxAmount: must be greater than 0',
        );
      });

      it('should throw when maxAmount is less than initialAmount', () => {
        const invalidMaxAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              maxAmount: bigIntToHex(
                parseUnits({ formatted: '0.5', decimals: 18 }),
              ), // 0.5 ETH
              initialAmount: bigIntToHex(
                parseUnits({ formatted: '1', decimals: 18 }),
              ), // 1 ETH
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(invalidMaxAmountRequest),
        ).toThrow('Invalid maxAmount: must be greater than initialAmount');
      });
    });

    describe('initialAmount validation', () => {
      it('should throw for zero initialAmount', () => {
        const zeroInitialAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              initialAmount: '0x0' as `0x${string}`,
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(zeroInitialAmountRequest),
        ).toThrow('Invalid initialAmount: must be greater than 0');
      });

      it('should allow missing initialAmount', () => {
        const noInitialAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
            },
          },
        };
        delete noInitialAmountRequest.permission.data.initialAmount;

        expect(() =>
          parseAndValidatePermission(noInitialAmountRequest),
        ).not.toThrow();
      });
    });

    describe('amountPerSecond validation', () => {
      it('should throw for zero amountPerSecond', () => {
        const zeroAmountPerSecondRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              amountPerSecond: '0x0' as `0x${string}`,
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(zeroAmountPerSecondRequest),
        ).toThrow('Invalid amountPerSecond: must be greater than 0');
      });
    });

    describe('startTime validation', () => {
      it('should throw for negative startTime', () => {
        const negativeStartTimeRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: -1,
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(negativeStartTimeRequest),
        ).toThrow(
          'Failed type validation: data.startTime: Start time must be today or later',
        );
      });

      it('should throw for zero startTime', () => {
        const zeroStartTimeRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: 0,
            },
          },
        };

        expect(() => parseAndValidatePermission(zeroStartTimeRequest)).toThrow(
          'Failed type validation: data.startTime: Start time must be today or later',
        );
      });

      it('should throw for non-integer startTime', () => {
        const floatStartTimeRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: Math.floor(Date.now() / 1000) + 86400 + 0.5, // Tomorrow + 0.5 seconds
            },
          },
        };

        expect(() => parseAndValidatePermission(floatStartTimeRequest)).toThrow(
          'Failed type validation: data.startTime: Expected integer, received float',
        );
      });
    });
  });
});
