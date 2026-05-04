import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { DelegationContracts } from '../../../src/core/chainMetadata';
import { createPermissionCaveats } from '../../../src/permissions/nativeTokenAllowance/caveats';
import type { PopulatedNativeTokenAllowancePermission } from '../../../src/permissions/nativeTokenAllowance/types';
import { PERIOD_TRANSFER_PERIOD_DURATION_UINT256_MAX } from '../../../src/permissions/shared';
import { parseUnits } from '../../../src/utils/value';

const contracts = {
  nativeTokenPeriodTransferEnforcer:
    '0x726B9Dc7515524819365AC0Cf6464C683Ae61765',
  exactCalldataEnforcer: '0x9Ec1216e9E98311bF49f7b644cEE7865672fF4B9',
} as unknown as DelegationContracts;

const createExpectedTerms = (
  permission: PopulatedNativeTokenAllowancePermission,
): string => {
  const amountHex = permission.data.allowanceAmount.slice(2).padStart(64, '0');
  const periodDurationHex =
    PERIOD_TRANSFER_PERIOD_DURATION_UINT256_MAX.toString(16).padStart(64, '0');
  const startTimeHex = permission.data.startTime.toString(16).padStart(64, '0');

  return `0x${amountHex}${periodDurationHex}${startTimeHex}`;
};

describe('nativeTokenAllowance:caveats', () => {
  describe('createPermissionCaveats()', () => {
    it('should create native period transfer and exactCalldata caveats', async () => {
      const permission: PopulatedNativeTokenAllowancePermission = {
        type: 'native-token-allowance',
        data: {
          allowanceAmount: bigIntToHex(
            parseUnits({ formatted: '1', decimals: 18 }),
          ),
          startTime: 499132800,
          justification: 'Permission to do something important',
        },
        isAdjustmentAllowed: true,
      };

      const caveats = await createPermissionCaveats({ permission, contracts });

      const expectedTerms = createExpectedTerms(permission);

      expect(caveats).toStrictEqual([
        {
          enforcer: contracts.nativeTokenPeriodTransferEnforcer,
          terms: expectedTerms,
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
