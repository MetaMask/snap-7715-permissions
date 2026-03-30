import { isHexString } from '@metamask/utils';

import type { DelegationContracts } from '../../src/core/chainMetadata';
import {
  getChainMetadata,
  getConfiguredChainIds,
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
        eip7702StatelessDeleGatorImpl: expect.any(String),
        limitedCallsEnforcer: expect.any(String),
        erc20StreamingEnforcer: expect.any(String),
        erc20PeriodTransferEnforcer: expect.any(String),
        nativeTokenStreamingEnforcer: expect.any(String),
        nativeTokenPeriodTransferEnforcer: expect.any(String),
        valueLteEnforcer: expect.any(String),
        timestampEnforcer: expect.any(String),
        exactCalldataEnforcer: expect.any(String),
        nonceEnforcer: expect.any(String),
        allowedCalldataEnforcer: expect.any(String),
      },
      name: expect.any(String),
      explorerUrl: expect.any(String),
    };

    describe('for supported chains with metadata', () => {
      it.each(chainsWithFullMetadata)(
        'should return complete metadata for chain %s',
        (chainId) => {
          const metadata = getChainMetadata({ chainId });

          expect(metadata).toMatchObject(metadataSchema);

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

          expect(metadata).toMatchObject({
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

        expect(metadata).toMatchObject({
          ...metadataSchema,
          explorerUrl: undefined,
        });

        // Should have default name format
        expect(metadata.name).toBe('Unknown chain 0x9999');

        // Explorer URL should be undefined
        expect(metadata.explorerUrl).toBeUndefined();
      });
    });

    describe('native token swap adapter', () => {
      it('includes tokenSwapAdapter on Ethereum mainnet', () => {
        const metadata = getChainMetadata({ chainId: 0x1 });
        expect(metadata.contracts.tokenSwapAdapter).toBe(
          '0xe41eb5a3f6e35f1a8c77113f372892d09820c3fd',
        );
      });

      it('omits tokenSwapAdapter when not deployed on chain', () => {
        const metadata = getChainMetadata({ chainId: 0xaa36a7 }); // Sepolia
        expect(metadata.contracts.tokenSwapAdapter).toBeUndefined();
      });
    });

    describe('getConfiguredChainIds', () => {
      it('returns sorted chain ids from nameAndExplorerUrlByChainId', () => {
        const ids = getConfiguredChainIds();
        expect(ids).toStrictEqual(
          Object.keys(nameAndExplorerUrlByChainId)
            .map((k) => Number(k))
            .sort((a, b) => a - b),
        );
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
          'allowedCalldataEnforcer',
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
