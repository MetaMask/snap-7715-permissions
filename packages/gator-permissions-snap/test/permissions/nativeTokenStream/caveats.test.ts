import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { DelegationContracts } from '../../../src/core/chainMetadata';
import { createPermissionCaveats } from '../../../src/permissions/nativeTokenStream/caveats';
import type { PopulatedNativeTokenStreamPermission } from '../../../src/permissions/nativeTokenStream/types';
import { parseUnits } from '../../../src/utils/value';

describe('nativeTokenStream:caveats', () => {
  describe('createPermissionCaveats()', () => {
    const contracts = {
      nativeTokenStreamingEnforcer:
        '0x19B32b6E6e4a8eD49805cC8Fe929a4Fd90287Df9',
      exactCalldataEnforcer: '0xB1cd88EF93BF9e34c0fE5bF0D20B9c5499049d80',
    } as unknown as DelegationContracts;

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
      isAdjustmentAllowed: true,
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
          enforcer: contracts.nativeTokenStreamingEnforcer,
          terms: nativeTokenStreamExpectedTerms,
          args: '0x',
        },
        {
          enforcer: contracts.exactCalldataEnforcer,
          terms: '0x',
          args: '0x',
        },
      ]);
    });
  });
});
