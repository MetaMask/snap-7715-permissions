import { describe, expect, it } from '@jest/globals';
import { InvalidParamsError } from '@metamask/snaps-sdk';
import { parseAndValidatePermission } from '../../../src/permissions/nativeTokenStream/validation';
import type { NativeTokenStreamPermissionRequest } from '../../../src/permissions/nativeTokenStream/types';
import { toHex, parseUnits } from 'viem/utils';
import { convertReadableDateToTimestamp } from '../../../src/utils/time';

const validPermissionRequest: NativeTokenStreamPermissionRequest = {
  chainId: '0x1',
  expiry: convertReadableDateToTimestamp('05/01/2024'),
  signer: {
    type: 'account',
    data: {
      address: '0x1',
    },
  },
  permission: {
    type: 'native-token-stream',
    data: {
      initialAmount: toHex(parseUnits('1', 18)) as `0x${string}`, // 1 ETH
      maxAmount: toHex(parseUnits('10', 18)) as `0x${string}`, // 10 ETH
      amountPerSecond: toHex(parseUnits('.5', 18)) as `0x${string}`, // 0.5 ETH per second
      startTime: convertReadableDateToTimestamp('10/26/2024'),
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
      expect(result).toEqual(validPermissionRequest);
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
      ).toThrow(InvalidParamsError);
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
          'Invalid maxAmount: must be a positive number',
        );
      });

      it('should throw when maxAmount is less than initialAmount', () => {
        const invalidMaxAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              maxAmount: toHex(parseUnits('0.5', 18)) as `0x${string}`, // 0.5 ETH
              initialAmount: toHex(parseUnits('1', 18)) as `0x${string}`, // 1 ETH
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
        ).toThrow('Invalid initialAmount: must be greater than zero');
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
        ).toThrow('Invalid amountPerSecond: must be a positive number');
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
        ).toThrow('Invalid startTime: must be a positive number');
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
          'Invalid startTime: must be a positive number',
        );
      });

      it('should throw for non-integer startTime', () => {
        const floatStartTimeRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: 1.5,
            },
          },
        };

        expect(() => parseAndValidatePermission(floatStartTimeRequest)).toThrow(
          'Invalid startTime: must be an integer',
        );
      });
    });
  });
});
