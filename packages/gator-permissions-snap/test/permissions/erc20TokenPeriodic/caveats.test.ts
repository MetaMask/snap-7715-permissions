import { describe, expect, it } from '@jest/globals';
import type { CoreCaveatBuilder } from '@metamask/delegation-toolkit';
import { toHex, parseUnits } from 'viem/utils';

import { TimePeriod } from '../../../src/core/types';
import { appendCaveats } from '../../../src/permissions/erc20TokenPeriodic/caveats';
import type { PopulatedErc20TokenPeriodicPermission } from '../../../src/permissions/erc20TokenPeriodic/types';
import {
  convertReadableDateToTimestamp,
  TIME_PERIOD_TO_SECONDS,
} from '../../../src/utils/time';

const tokenDecimals = 6;

describe('erc20TokenPeriodic:caveats', () => {
  describe('appendCaveats()', () => {
    it('should append caveats for a permission', async () => {
      const permission: PopulatedErc20TokenPeriodicPermission = {
        type: 'erc20-token-periodic',
        data: {
          periodAmount: toHex(parseUnits('100', tokenDecimals)), // 100 USDC per period
          periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]), // 1 day in seconds
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      await appendCaveats({ permission, caveatBuilder });

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'erc20PeriodTransfer',
        permission.data.tokenAddress,
        BigInt(permission.data.periodAmount),
        permission.data.periodDuration,
        permission.data.startTime,
      );

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith('valueLte', 0n);
    });

    it('should append caveats for daily period type', async () => {
      const permission: PopulatedErc20TokenPeriodicPermission = {
        type: 'erc20-token-periodic',
        data: {
          periodAmount: toHex(parseUnits('50', tokenDecimals)), // 50 USDC per period
          periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]), // 1 day in seconds
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      await appendCaveats({ permission, caveatBuilder });

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'erc20PeriodTransfer',
        permission.data.tokenAddress,
        BigInt(permission.data.periodAmount),
        permission.data.periodDuration,
        permission.data.startTime,
      );

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith('valueLte', 0n);
    });

    it('should append caveats for weekly period type', async () => {
      const permission: PopulatedErc20TokenPeriodicPermission = {
        type: 'erc20-token-periodic',
        data: {
          periodAmount: toHex(parseUnits('200', tokenDecimals)), // 200 USDC per period
          periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY]), // 1 week in seconds
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      await appendCaveats({ permission, caveatBuilder });

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'erc20PeriodTransfer',
        permission.data.tokenAddress,
        BigInt(permission.data.periodAmount),
        permission.data.periodDuration,
        permission.data.startTime,
      );

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith('valueLte', 0n);
    });

    it('should append caveats for other period type', async () => {
      const permission: PopulatedErc20TokenPeriodicPermission = {
        type: 'erc20-token-periodic',
        data: {
          periodAmount: toHex(parseUnits('75', tokenDecimals)), // 75 USDC per period
          periodDuration: 123456, // Custom duration in seconds
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      await appendCaveats({ permission, caveatBuilder });

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'erc20PeriodTransfer',
        permission.data.tokenAddress,
        BigInt(permission.data.periodAmount),
        permission.data.periodDuration,
        permission.data.startTime,
      );

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith('valueLte', 0n);
    });

    it('should append caveats for different token address', async () => {
      const permission: PopulatedErc20TokenPeriodicPermission = {
        type: 'erc20-token-periodic',
        data: {
          periodAmount: toHex(parseUnits('1000', 18)), // 1000 tokens with 18 decimals
          periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]),
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          tokenAddress: '0x1234567890123456789012345678901234567890', // Different token
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      await appendCaveats({ permission, caveatBuilder });

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith(
        'erc20PeriodTransfer',
        permission.data.tokenAddress,
        BigInt(permission.data.periodAmount),
        permission.data.periodDuration,
        permission.data.startTime,
      );

      expect(caveatBuilder.addCaveat).toHaveBeenCalledWith('valueLte', 0n);
    });
  });
});
