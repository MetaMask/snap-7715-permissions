import { describe, expect, it } from '@jest/globals';
import { toHex, parseUnits } from 'viem/utils';

import { TimePeriod } from '../../../src/core/types';
import { createPermissionCaveats } from '../../../src/permissions/nativeTokenPeriodic/caveats';
import type { PopulatedNativeTokenPeriodicPermission } from '../../../src/permissions/nativeTokenPeriodic/types';
import {
  convertReadableDateToTimestamp,
  TIME_PERIOD_TO_SECONDS,
} from '../../../src/utils/time';
import { DelegationContracts } from 'src/core/delegationContracts';

// Define the contracts with enforcers
const contracts = {
  enforcers: {
    NativeTokenPeriodicTransferEnforcer:
      '0x726B9Dc7515524819365AC0Cf6464C683Ae61765',
    ExactCalldataEnforcer: '0x9Ec1216e9E98311bF49f7b644cEE7865672fF4B9',
  },
} as any as DelegationContracts;

// Helper function to create expected terms
const createExpectedTerms = (
  permission: PopulatedNativeTokenPeriodicPermission,
) => {
  const periodAmountHex = permission.data.periodAmount
    .slice(2)
    .padStart(64, '0');
  const periodDurationHex = permission.data.periodDuration
    .toString(16)
    .padStart(64, '0');
  const startTimeHex = permission.data.startTime.toString(16).padStart(64, '0');

  return `0x${periodAmountHex}${periodDurationHex}${startTimeHex}`;
};

describe('nativeTokenPeriodic:caveats', () => {
  describe('createPermissionCaveats()', () => {
    it('should create nativeTokenPeriodic and exactCalldata caveats', async () => {
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

      const caveats = await createPermissionCaveats({ permission, contracts });

      const nativeTokenPeriodicExpectedTerms = createExpectedTerms(permission);

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.enforcers.NativeTokenPeriodicTransferEnforcer,
          terms: nativeTokenPeriodicExpectedTerms,
          args: '0x',
        },
        {
          enforcer: contracts.enforcers.ExactCalldataEnforcer,
          terms: '0x',
          args: '0x',
        },
      ]);
    });

    // Additional test cases for different period types
    it('should create nativeTokenPeriodic and exactCalldata caveats for weekly period type', async () => {
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

      const caveats = await createPermissionCaveats({ permission, contracts });

      const nativeTokenPeriodicExpectedTerms = createExpectedTerms(permission);

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.enforcers.NativeTokenPeriodicTransferEnforcer,
          terms: nativeTokenPeriodicExpectedTerms,
          args: '0x',
        },
        {
          enforcer: contracts.enforcers.ExactCalldataEnforcer,
          terms: '0x',
          args: '0x',
        },
      ]);
    });

    it('should create nativeTokenPeriodic and exactCalldata caveats for custom period type', async () => {
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

      const caveats = await createPermissionCaveats({ permission, contracts });

      const nativeTokenPeriodicExpectedTerms = createExpectedTerms(permission);

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.enforcers.NativeTokenPeriodicTransferEnforcer,
          terms: nativeTokenPeriodicExpectedTerms,
          args: '0x',
        },
        {
          enforcer: contracts.enforcers.ExactCalldataEnforcer,
          terms: '0x',
          args: '0x',
        },
      ]);
    });
  });
});
