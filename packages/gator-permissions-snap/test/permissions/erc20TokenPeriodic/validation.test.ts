import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import { TimePeriod } from '../../../src/core/types';
import type { Erc20TokenPeriodicPermissionRequest } from '../../../src/permissions/erc20TokenPeriodic/types';
import { parseAndValidatePermission } from '../../../src/permissions/erc20TokenPeriodic/validation';
import { TIME_PERIOD_TO_SECONDS } from '../../../src/utils/time';
import { parseUnits } from '../../../src/utils/value';

const tokenDecimals = 6;

const validPermissionRequest: Erc20TokenPeriodicPermissionRequest = {
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
    type: 'erc20-token-periodic',
    data: {
      periodAmount: bigIntToHex(
        parseUnits({ formatted: '100', decimals: tokenDecimals }),
      ), // 100 USDC per period
      periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]), // 1 day in seconds
      startTime: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  },
};

describe('erc20TokenPeriodic:validation', () => {
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
        'Failed type validation: type: Invalid literal value, expected "erc20-token-periodic"',
      );
    });

    describe('periodAmount validation', () => {
      it('should throw for zero periodAmount', () => {
        const zeroPeriodAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              periodAmount: '0x0' as `0x${string}`,
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(zeroPeriodAmountRequest),
        ).toThrow('Invalid periodAmount: must be greater than 0');
      });

      it('should validate a valid periodAmount', () => {
        const validPeriodAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              periodAmount: bigIntToHex(
                parseUnits({ formatted: '50', decimals: tokenDecimals }),
              ),
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(validPeriodAmountRequest),
        ).not.toThrow();
      });
    });

    describe('periodDuration validation', () => {
      it('should throw for zero periodDuration', () => {
        const zeroPeriodDurationRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              periodDuration: 0,
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(zeroPeriodDurationRequest),
        ).toThrow(
          'Failed type validation: data.periodDuration: Number must be greater than 0',
        );
      });

      it('should throw for negative periodDuration', () => {
        const negativePeriodDurationRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              periodDuration: -1,
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(negativePeriodDurationRequest),
        ).toThrow(
          'Failed type validation: data.periodDuration: Number must be greater than 0',
        );
      });

      it('should throw for non-integer periodDuration', () => {
        const floatPeriodDurationRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              periodDuration: 1.5,
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(floatPeriodDurationRequest),
        ).toThrow(
          'Failed type validation: data.periodDuration: Expected integer, received float',
        );
      });

      it('should validate periodDuration for daily period', () => {
        const dailyPeriodRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]),
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(dailyPeriodRequest),
        ).not.toThrow();
      });

      it('should validate periodDuration for weekly period', () => {
        const weeklyPeriodRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY]),
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(weeklyPeriodRequest),
        ).not.toThrow();
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
          'Failed type validation: data.startTime: Number must be greater than 0, data.startTime: Start time must be today or later',
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
          'Failed type validation: data.startTime: Number must be greater than 0, data.startTime: Start time must be today or later',
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

    describe('tokenAddress validation', () => {
      it('should throw for invalid hex tokenAddress', () => {
        const emptyTokenAddressRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              tokenAddress: '' as `0x${string}`,
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(emptyTokenAddressRequest),
        ).toThrow(
          'Failed type validation: data.tokenAddress: Invalid Ethereum address',
        );
      });

      it('should throw for 0x tokenAddress', () => {
        const invalidTokenAddressRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              tokenAddress: '0x' as `0x${string}`,
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(invalidTokenAddressRequest),
        ).toThrow(
          'Failed type validation: data.tokenAddress: Invalid Ethereum address',
        );
      });

      it('should validate a valid tokenAddress', () => {
        const validTokenAddressRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              tokenAddress: '0x1234567890123456789012345678901234567890',
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(validTokenAddressRequest),
        ).not.toThrow();
      });
    });

    describe('startTime vs expiry validation', () => {
      it('should throw when startTime is equal to expiry', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        const startTimeVsExpiryRequest = {
          ...validPermissionRequest,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: currentTime + 86400, // 1 day from now
              },
              isAdjustmentAllowed: true,
            },
          ],
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: currentTime + 86400, // Same as expiry
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(startTimeVsExpiryRequest),
        ).toThrow('Invalid startTime: must be before expiry');
      });

      it('should throw when startTime is after expiry', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        const startTimeAfterExpiryRequest = {
          ...validPermissionRequest,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: currentTime + 86400, // 1 day from now
              },
              isAdjustmentAllowed: true,
            },
          ],
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: currentTime + 86400 * 2, // 2 days from now (after expiry)
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(startTimeAfterExpiryRequest),
        ).toThrow('Invalid startTime: must be before expiry');
      });

      it('should validate when startTime is before expiry', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        const validStartTimeVsExpiryRequest = {
          ...validPermissionRequest,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: currentTime + 86400 * 2, // 2 days from now
              },
              isAdjustmentAllowed: true,
            },
          ],
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: currentTime + 86400, // 1 day from now (before expiry)
            },
          },
        };

        expect(() =>
          parseAndValidatePermission(validStartTimeVsExpiryRequest),
        ).not.toThrow();
      });
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
