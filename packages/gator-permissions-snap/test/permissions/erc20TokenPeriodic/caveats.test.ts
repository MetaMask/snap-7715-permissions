import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { DelegationContracts } from '../../../src/core/chainMetadata';
import { TimePeriod } from '../../../src/core/types';
import { createPermissionCaveats } from '../../../src/permissions/erc20TokenPeriodic/caveats';
import type { PopulatedErc20TokenPeriodicPermission } from '../../../src/permissions/erc20TokenPeriodic/types';
import {
  convertReadableDateToTimestamp,
  TIME_PERIOD_TO_SECONDS,
} from '../../../src/utils/time';
import { parseUnits } from '../../../src/utils/value';

const tokenDecimals = 6;

// Define the contracts with enforcers
const contracts = {
  enforcers: {
    ERC20PeriodicTransferEnforcer: '0x1234567890123456789012345678901234567890',
    ValueLteEnforcer: '0x1234567890123456789012345678901234567891',
  },
} as any as DelegationContracts;

// Helper function to create expected terms
const createExpectedTerms = (
  permission: PopulatedErc20TokenPeriodicPermission,
) => {
  const periodAmountHex = permission.data.periodAmount
    .slice(2)
    .padStart(64, '0');
  const periodDurationHex = permission.data.periodDuration
    .toString(16)
    .padStart(64, '0');
  const startTimeHex = permission.data.startTime.toString(16).padStart(64, '0');
  const tokenAddressHex = permission.data.tokenAddress.slice(2);

  return `0x${tokenAddressHex}${periodAmountHex}${periodDurationHex}${startTimeHex}`;
};

describe('erc20TokenPeriodic:caveats', () => {
  describe('createPermissionCaveats()', () => {
    it('should create erc20TokenPeriodic and valueLte caveats', async () => {
      const permission: PopulatedErc20TokenPeriodicPermission = {
        type: 'erc20-token-periodic',
        data: {
          periodAmount: bigIntToHex(
            parseUnits({ formatted: '100', decimals: tokenDecimals }),
          ), // 100 USDC per period
          periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]), // 1 day in seconds
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveats = await createPermissionCaveats({ permission, contracts });

      const erc20TokenPeriodicExpectedTerms = createExpectedTerms(permission);

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.enforcers.ERC20PeriodicTransferEnforcer,
          terms: erc20TokenPeriodicExpectedTerms,
          args: '0x',
        },
        {
          enforcer: contracts.enforcers.ValueLteEnforcer,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          args: '0x',
        },
      ]);
    });

    // Additional test cases for different period types
    it('should create erc20TokenPeriodic and valueLte caveats for weekly period type', async () => {
      const permission: PopulatedErc20TokenPeriodicPermission = {
        type: 'erc20-token-periodic',
        data: {
          periodAmount: bigIntToHex(
            parseUnits({ formatted: '200', decimals: tokenDecimals }),
          ), // 200 USDC per period
          periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY]), // 1 week in seconds
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveats = await createPermissionCaveats({ permission, contracts });

      const erc20TokenPeriodicExpectedTerms = createExpectedTerms(permission);

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.enforcers.ERC20PeriodicTransferEnforcer,
          terms: erc20TokenPeriodicExpectedTerms,
          args: '0x',
        },
        {
          enforcer: contracts.enforcers.ValueLteEnforcer,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          args: '0x',
        },
      ]);
    });

    it('should create erc20TokenPeriodic and valueLte caveats for custom period type', async () => {
      const permission: PopulatedErc20TokenPeriodicPermission = {
        type: 'erc20-token-periodic',
        data: {
          periodAmount: bigIntToHex(
            parseUnits({ formatted: '75', decimals: tokenDecimals }),
          ), // 75 USDC per period
          periodDuration: 123456, // Custom duration in seconds
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveats = await createPermissionCaveats({ permission, contracts });

      const erc20TokenPeriodicExpectedTerms = createExpectedTerms(permission);

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.enforcers.ERC20PeriodicTransferEnforcer,
          terms: erc20TokenPeriodicExpectedTerms,
          args: '0x',
        },
        {
          enforcer: contracts.enforcers.ValueLteEnforcer,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          args: '0x',
        },
      ]);
    });

    it('should create erc20TokenPeriodic and valueLte caveats for different token address', async () => {
      const permission: PopulatedErc20TokenPeriodicPermission = {
        type: 'erc20-token-periodic',
        data: {
          periodAmount: bigIntToHex(
            parseUnits({ formatted: '1000', decimals: 18 }),
          ), // 1000 tokens with 18 decimals
          periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]),
          startTime: convertReadableDateToTimestamp('10/26/1985'),
          tokenAddress: '0x1234567890123456789012345678901234567890', // Different token
          justification: 'Permission to do something important',
        },
        rules: {},
      };

      const caveats = await createPermissionCaveats({ permission, contracts });

      const erc20TokenPeriodicExpectedTerms = createExpectedTerms(permission);

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.enforcers.ERC20PeriodicTransferEnforcer,
          terms: erc20TokenPeriodicExpectedTerms,
          args: '0x',
        },
        {
          enforcer: contracts.enforcers.ValueLteEnforcer,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          args: '0x',
        },
      ]);
    });
  });
});
