import type { SnapsEthereumProvider } from '@metamask/snaps-sdk';
import { custom } from 'viem';

/**
 * Ethereum provider for Snap viem transport.
 *
 * @param snapsEthereumProvider - Snaps Ethereum provider.
 * @returns Viem transport for Snap Ethereum provider.
 */
export const snapTansport = (snapsEthereumProvider: SnapsEthereumProvider) =>
  custom(snapsEthereumProvider, {
    name: 'Snap Ethereum Provider Transport',
  });
