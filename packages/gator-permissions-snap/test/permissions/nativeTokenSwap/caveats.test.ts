import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { DelegationContracts } from '../../../src/core/chainMetadata';
import { createPermissionCaveats } from '../../../src/permissions/nativeTokenSwap/caveats';
import type { PopulatedNativeTokenSwapPermission } from '../../../src/permissions/nativeTokenSwap/types';
import { parseUnits } from '../../../src/utils/value';

const contracts = {
  valueLteEnforcer: '0x1234567890123456789012345678901234567891',
} as unknown as DelegationContracts;

describe('nativeTokenSwap:caveats', () => {
  describe('createPermissionCaveats()', () => {
    it('returns an empty caveat list', async () => {
      const maxWei = parseUnits({ formatted: '0.5', decimals: 18 });
      const permission: PopulatedNativeTokenSwapPermission = {
        type: 'native-token-swap',
        data: {
          justification: 'Swap cap',
          maxNativeSwapAmount: bigIntToHex(maxWei),
          whitelistedTokensOnly: false,
        },
        isAdjustmentAllowed: true,
      };

      const caveats = await createPermissionCaveats({ permission, contracts });

      expect(caveats).toStrictEqual([]);
    });
  });
});
