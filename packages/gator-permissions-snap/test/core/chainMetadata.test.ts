import { isHexString } from '@metamask/utils';

import type { DelegationContracts } from '../../src/core/chainMetadata';
import { getChainMetadata } from '../../src/core/chainMetadata';

// Chains with name and explorer URL configuration
const CHAINS_WITH_METADATA = [
  // Mainnets
  1,
  // Testnets
  97, 1301, 6342, 10200, 80002, 80069, 84532, 421614, 11155111, 11155420,

  // not yet supported in @metamask/delegation-deployments: 5115, 763373, 763373
];

describe('chainMetadata', () => {
  describe('getChainMetadata()', () => {
    const metadataSchema = {
      contracts: {
        delegationManager: expect.any(String),
        limitedCallsEnforcer: expect.any(String),
        erc20StreamingEnforcer: expect.any(String),
        erc20PeriodTransferEnforcer: expect.any(String),
        nativeTokenStreamingEnforcer: expect.any(String),
        nativeTokenPeriodTransferEnforcer: expect.any(String),
        valueLteEnforcer: expect.any(String),
        timestampEnforcer: expect.any(String),
        exactCalldataEnforcer: expect.any(String),
        nonceEnforcer: expect.any(String),
      },
      name: expect.any(String),
      explorerUrl: expect.any(String),
    };

    describe('for supported chains with metadata', () => {
      it.each(CHAINS_WITH_METADATA)(
        'should return complete metadata for chain %s',
        (chainId) => {
          const metadata = getChainMetadata({ chainId });

          expect(metadata).toStrictEqual(metadataSchema);

          // Verify metadata structure
          expect(metadata).toHaveProperty('contracts');
          expect(metadata).toHaveProperty('name');
          expect(metadata).toHaveProperty('explorerUrl');

          // Name should not be the default "Unknown chain" format
          expect(metadata.name).not.toMatch(/^Unknown chain 0x/u);

          // Explorer URL should be defined for chains with metadata
          expect(metadata.explorerUrl).toBeDefined();
          expect(typeof metadata.explorerUrl).toBe('string');
        },
      );
    });

    describe('for supported hains without metadata', () => {
      it('returns metadata with default name for unknown chain', () => {
        const metadata = getChainMetadata({ chainId: 0x9999 });

        expect(metadata).toStrictEqual({
          ...metadataSchema,
          explorerUrl: undefined,
        });

        // Should have default name format
        expect(metadata.name).toBe('Unknown chain 0x9999');

        // Explorer URL should be undefined
        expect(metadata.explorerUrl).toBeUndefined();
      });
    });

    describe('contract validation', () => {
      it('returns all required contracts for a supported chain', () => {
        const expectedContracts: (keyof DelegationContracts)[] = [
          'limitedCallsEnforcer',
          'erc20StreamingEnforcer',
          'erc20PeriodTransferEnforcer',
          'nativeTokenStreamingEnforcer',
          'nativeTokenPeriodTransferEnforcer',
          'valueLteEnforcer',
          'timestampEnforcer',
          'exactCalldataEnforcer',
          'nonceEnforcer',
          'delegationManager',
        ];

        const metadata = getChainMetadata({ chainId: 11155111 }); // Sepolia

        expectedContracts.forEach((contract) => {
          expect(metadata.contracts).toHaveProperty(contract);
          expect(typeof metadata.contracts[contract]).toBe('string');
          expect(isHexString(metadata.contracts[contract])).toBe(true);
        });
      });
    });
  });
});
