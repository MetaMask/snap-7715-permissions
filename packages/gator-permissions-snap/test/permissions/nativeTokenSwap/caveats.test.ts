import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import { getChainMetadata } from '../../../src/core/chainMetadata';
import { createPermissionCaveats } from '../../../src/permissions/nativeTokenSwap/caveats';
import type { PopulatedNativeTokenSwapPermission } from '../../../src/permissions/nativeTokenSwap/types';
import { parseUnits } from '../../../src/utils/value';

describe('nativeTokenSwap:caveats', () => {
  describe('createPermissionCaveats()', () => {
    it('returns caveats including redeemer for the chain swap adapter', async () => {
      const { contracts } = getChainMetadata({ chainId: 0x1 });
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

      expect(caveats).toHaveLength(4);
      expect(contracts.nativeTokenSwapAdapter).toBeDefined();
    });
  });
});
