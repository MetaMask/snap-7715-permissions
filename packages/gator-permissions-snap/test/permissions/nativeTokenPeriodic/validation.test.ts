import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import { TimePeriod } from '../../../src/core/types';
import type { NativeTokenPeriodicPermissionRequest } from '../../../src/permissions/nativeTokenPeriodic/types';
import { parseAndValidatePermission } from '../../../src/permissions/nativeTokenPeriodic/validation';
import {
  convertReadableDateToTimestamp,
  TIME_PERIOD_TO_SECONDS,
} from '../../../src/utils/time';
import { parseUnits } from '../../../src/utils/value';

const validPermissionRequest: NativeTokenPeriodicPermissionRequest = {
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
    type: 'native-token-periodic',
    data: {
      periodAmount: bigIntToHex(parseUnits({ formatted: '1', decimals: 18 })), // 1 ETH per period
      periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]), // 1 day in seconds
      startTime: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
      justification: 'test',
    },
    rules: {},
  },
};

describe('nativeTokenPeriodic:validation', () => {
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
        'Failed type validation: type: Invalid literal value, expected "native-token-periodic"',
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
