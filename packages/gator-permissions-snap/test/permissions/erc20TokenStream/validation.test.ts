import { describe, expect, it } from '@jest/globals';
import { toHex, parseUnits } from 'viem/utils';

import type { Erc20TokenStreamPermissionRequest } from '../../../src/permissions/erc20TokenStream/types';
import { parseAndValidatePermission } from '../../../src/permissions/erc20TokenStream/validation';
import { convertReadableDateToTimestamp } from '../../../src/utils/time';

const tokenDecimals = 10;

const validPermissionRequest: Erc20TokenStreamPermissionRequest = {
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
    type: 'erc20-token-stream',
    data: {
      initialAmount: toHex(parseUnits('1', tokenDecimals)), // 1 token
      maxAmount: toHex(parseUnits('10', tokenDecimals)), // 10 tokens
      amountPerSecond: toHex(parseUnits('.5', tokenDecimals)), // 0.5 tokens per second
      startTime: convertReadableDateToTimestamp('10/26/2024'),
      tokenAddress: '0x1234567890123456789012345678901234567890',
      justification: 'test',
    },
    rules: {},
  },
};

describe('erc20TokenStream:validation', () => {
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
        'Failed type validation: type: Invalid literal value, expected "erc20-token-stream"',
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
              maxAmount: toHex(parseUnits('0.5', tokenDecimals)), // 0.5 tokens
              initialAmount: toHex(parseUnits('1', tokenDecimals)), // 1 token
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

    describe('tokenAddress validation', () => {
      it('should throw for invalid token address', () => {
        const invalidTokenAddressRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              tokenAddress: '0xinvalid',
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(invalidTokenAddressRequest),
        ).toThrow(
          'Failed type validation: data.tokenAddress: Invalid hex value',
        );
      });

      it('should throw for missing token address', () => {
        const missingTokenAddressRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
            },
          },
        };
        delete (missingTokenAddressRequest.permission.data as any).tokenAddress;

        expect(() =>
          parseAndValidatePermission(missingTokenAddressRequest),
        ).toThrow('Failed type validation: data.tokenAddress: Required');
      });
    });
  });
});
