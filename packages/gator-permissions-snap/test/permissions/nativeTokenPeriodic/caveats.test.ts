import { describe, expect, it } from '@jest/globals';
import { toHex, parseUnits } from 'viem/utils';
import type { CoreCaveatBuilder } from '@metamask/delegation-toolkit';

import { TimePeriod } from '../../../src/core/types';
import { appendCaveats } from '../../../src/permissions/nativeTokenPeriodic/caveats';
import type { PopulatedNativeTokenPeriodicPermission } from '../../../src/permissions/nativeTokenPeriodic/types';
import {
  convertReadableDateToTimestamp,
  TIME_PERIOD_TO_SECONDS,
} from '../../../src/utils/time';

describe('nativeTokenPeriodic:caveats', () => {
  describe('appendCaveats()', () => {
    it('should append caveats for a permission', async () => {
      const permission: PopulatedNativeTokenPeriodicPermission = {
        type: 'native-token-periodic',
        data: {
          periodAmount: toHex(parseUnits('1', 18)), // 1 ETH per period
          periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]), // 1 day in seconds
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      await appendCaveats({ permission, caveatBuilder });

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'nativeTokenPeriodTransfer',
        BigInt(permission.data.periodAmount),
        permission.data.periodDuration,
        permission.data.startTime,
      );

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'exactCalldata',
        '0x',
      );
    });

    it('should append caveats for daily period type', async () => {
      const permission: PopulatedNativeTokenPeriodicPermission = {
        type: 'native-token-periodic',
        data: {
          periodAmount: toHex(parseUnits('1', 18)), // 1 ETH per period
          periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]), // 1 day in seconds
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      await appendCaveats({ permission, caveatBuilder });

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'nativeTokenPeriodTransfer',
        BigInt(permission.data.periodAmount),
        permission.data.periodDuration,
        permission.data.startTime,
      );

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'exactCalldata',
        '0x',
      );
    });

    it('should append caveats for weekly period type', async () => {
      const permission: PopulatedNativeTokenPeriodicPermission = {
        type: 'native-token-periodic',
        data: {
          periodAmount: toHex(parseUnits('1', 18)), // 1 ETH per period
          periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY]), // 1 week in seconds
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      await appendCaveats({ permission, caveatBuilder });

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'nativeTokenPeriodTransfer',
        BigInt(permission.data.periodAmount),
        permission.data.periodDuration,
        permission.data.startTime,
      );

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'exactCalldata',
        '0x',
      );
    });

    it('should append caveats for other period type', async () => {
      const permission: PopulatedNativeTokenPeriodicPermission = {
        type: 'native-token-periodic',
        data: {
          periodAmount: toHex(parseUnits('1', 18)), // 1 ETH per period
          periodDuration: 123456, // Custom duration in seconds
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      await appendCaveats({ permission, caveatBuilder });

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'nativeTokenPeriodTransfer',
        BigInt(permission.data.periodAmount),
        permission.data.periodDuration,
        permission.data.startTime,
      );

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'exactCalldata',
        '0x',
      );
    });
  });
});
