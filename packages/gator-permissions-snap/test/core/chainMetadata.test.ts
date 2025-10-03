import { isHexString } from '@metamask/utils';

import type { DelegationContracts } from '../../src/core/chainMetadata';
import {
  getChainMetadata,
  nameAndExplorerUrlByChainId,
} from '../../src/core/chainMetadata';

// Chains with name and explorer URL configuration
const chainsWithMetadata = Object.keys(nameAndExplorerUrlByChainId).map((key) =>
  parseInt(key, 10),
);
const chainsWithNamesByNoExplorerUrl = chainsWithMetadata.filter(
  (chainId) => nameAndExplorerUrlByChainId[chainId]?.explorerUrl === undefined,
);
const chainsWithFullMetadata = chainsWithMetadata.filter(
  (chainId) => nameAndExplorerUrlByChainId[chainId]?.explorerUrl !== undefined,
);

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
      it.each(chainsWithFullMetadata)(
        'should return complete metadata for chain %s',
        (chainId) => {
          const metadata = getChainMetadata({ chainId });

          expect(metadata).toStrictEqual(metadataSchema);

          // Name should not be the default "Unknown chain" format
          expect(metadata.name).not.toMatch(/^Unknown chain 0x/u);
        },
      );
    });

    describe('for supported chains with names but no explorerUrl', () => {
      it.each(chainsWithNamesByNoExplorerUrl)(
        'should return complete metadata for chain %s',
        (chainId) => {
          const metadata = getChainMetadata({ chainId });

          expect(metadata).toStrictEqual({
            ...metadataSchema,
            explorerUrl: undefined,
          });

          // Name should not be the default "Unknown chain" format
          expect(metadata.name).not.toMatch(/^Unknown chain 0x/u);
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
