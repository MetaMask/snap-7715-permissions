import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { DelegationContracts } from '../../../src/core/chainMetadata';
import { createPermissionCaveats } from '../../../src/permissions/erc20TokenAllowance/caveats';
import type { PopulatedErc20TokenAllowancePermission } from '../../../src/permissions/erc20TokenAllowance/types';
import { PERIOD_TRANSFER_PERIOD_DURATION_UINT256_MAX } from '../../../src/permissions/shared';
import { parseUnits } from '../../../src/utils/value';

const tokenDecimals = 6;

const contracts = {
  erc20PeriodTransferEnforcer: '0x1234567890123456789012345678901234567890',
  valueLteEnforcer: '0x1234567890123456789012345678901234567891',
} as unknown as DelegationContracts;

const createExpectedTerms = (
  permission: PopulatedErc20TokenAllowancePermission,
): string => {
  const amountHex = permission.data.allowanceAmount.slice(2).padStart(64, '0');
  const periodDurationHex =
    PERIOD_TRANSFER_PERIOD_DURATION_UINT256_MAX.toString(16).padStart(64, '0');
  const startTimeHex = permission.data.startTime.toString(16).padStart(64, '0');
  const tokenAddressHex = permission.data.tokenAddress.slice(2);

  return `0x${tokenAddressHex}${amountHex}${periodDurationHex}${startTimeHex}`;
};

describe('erc20TokenAllowance:caveats', () => {
  describe('createPermissionCaveats()', () => {
    it('should create period transfer and valueLte caveats', async () => {
      const permission: PopulatedErc20TokenAllowancePermission = {
        type: 'erc20-token-allowance',
        data: {
          allowanceAmount: bigIntToHex(
            parseUnits({ formatted: '100', decimals: tokenDecimals }),
          ),
          startTime: 499132800,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          justification: 'Permission to do something important',
        },
        isAdjustmentAllowed: true,
      };

      const caveats = await createPermissionCaveats({ permission, contracts });

      const expectedTerms = createExpectedTerms(permission);

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.erc20PeriodTransferEnforcer,
          terms: expectedTerms,
          args: '0x',
        },
        {
          enforcer: contracts.valueLteEnforcer,
          terms:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          args: '0x',
        },
      ]);
    });
  });
});
