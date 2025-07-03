import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { DelegationContracts } from '../../../src/core/chainMetadata';
import { createPermissionCaveats } from '../../../src/permissions/erc20TokenStream/caveats';
import type { PopulatedErc20TokenStreamPermission } from '../../../src/permissions/erc20TokenStream/types';
import { convertReadableDateToTimestamp } from '../../../src/utils/time';
import { parseUnits } from '../../../src/utils/value';

describe('erc20TokenStream:caveats', () => {
  describe('createPermissionCaveats()', () => {
    const tokenDecimals = 10;
    const initialAmount = bigIntToHex(
      parseUnits({ formatted: '1', decimals: tokenDecimals }),
    );
    const maxAmount = bigIntToHex(
      parseUnits({ formatted: '10', decimals: tokenDecimals }),
    );
    const amountPerSecond = bigIntToHex(
      parseUnits({ formatted: '.5', decimals: tokenDecimals }),
    );
    const startTime = convertReadableDateToTimestamp('10/26/2024');
    const tokenAddress = '0x1234567890123456789012345678901234567890';

    const contracts = {
      enforcers: {
        ERC20StreamingEnforcer: '0x7356Ed4321Ff9e7DAE246461829cDC170ff660Ab',
        ValueLteEnforcer: '0x5e12Ca712176E7557e4fAa1c8cc27382B60B5e39',
      },
    } as any as DelegationContracts;

    const mockPermission: PopulatedErc20TokenStreamPermission = {
      type: 'erc20-token-stream',
      data: {
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
        tokenAddress,
        justification: 'test',
      },
      rules: {},
    };

    it('should create erc20Streaming and valueLte caveats', async () => {
      const caveats = await createPermissionCaveats({
        permission: mockPermission,
        contracts,
      });
      const initialAmountHex = initialAmount.slice(2).padStart(64, '0');
      const maxAmountHex = maxAmount.slice(2).padStart(64, '0');
      const amountPerSecondHex = amountPerSecond.slice(2).padStart(64, '0');
      const startTimeHex = startTime.toString(16).padStart(64, '0');
      const erc20StreamingExpectedTerms = `0x${tokenAddress.slice(2)}${initialAmountHex}${maxAmountHex}${amountPerSecondHex}${startTimeHex}`;

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.enforcers.ERC20StreamingEnforcer,
          terms: erc20StreamingExpectedTerms,
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
