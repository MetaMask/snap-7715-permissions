import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import { createPermissionCaveats } from '../../../src/permissions/nativeTokenStream/caveats';
import type { PopulatedNativeTokenStreamPermission } from '../../../src/permissions/nativeTokenStream/types';
import { DelegationContracts } from 'src/core/delegationContracts';
import { parseUnits } from '../../../src/utils/value';

describe('nativeTokenStream:caveats', () => {
  describe('createPermissionCaveats()', () => {
    const contracts = {
      enforcers: {
        NativeTokenStreamingEnforcer:
          '0x19B32b6E6e4a8eD49805cC8Fe929a4Fd90287Df9',
        ExactCalldataEnforcer: '0xB1cd88EF93BF9e34c0fE5bF0D20B9c5499049d80',
      },
    } as any as DelegationContracts;

    const initialAmount = bigIntToHex(
      parseUnits({ formatted: '1', decimals: 18 }),
    );
    const maxAmount = bigIntToHex(
      parseUnits({ formatted: '10', decimals: 18 }),
    );
    const amountPerSecond = bigIntToHex(
      parseUnits({ formatted: '.5', decimals: 18 }),
    );
    const startTime = 1714531200;

    const mockPermission: PopulatedNativeTokenStreamPermission = {
      type: 'native-token-stream',
      data: {
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
        justification: 'test',
      },
      rules: {},
    };

    it('should create nativeTokenStreaming and exactCalldata caveats', async () => {
      const caveats = await createPermissionCaveats({
        permission: mockPermission,
        contracts,
      });

      const initialAmountHex = initialAmount.slice(2).padStart(64, '0');
      const maxAmountHex = maxAmount.slice(2).padStart(64, '0');
      const amountPerSecondHex = amountPerSecond.slice(2).padStart(64, '0');
      const startTimeHex = startTime.toString(16).padStart(64, '0');

      const nativeTokenStreamExpectedTerms = `0x${initialAmountHex}${maxAmountHex}${amountPerSecondHex}${startTimeHex}`;

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.enforcers.NativeTokenStreamingEnforcer,
          terms: nativeTokenStreamExpectedTerms,
          args: '0x',
        },
        {
          enforcer: contracts.enforcers.ExactCalldataEnforcer,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          args: '0x',
        },
      ]);
    });
  });
});
