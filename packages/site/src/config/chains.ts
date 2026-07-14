import { defineChain, extractChain } from 'viem';
import type { Chain } from 'viem';
import * as chains from 'viem/chains';

/**
 * Robinhood Chain is not yet included in viem/chains.
 * Network details: https://docs.robinhood.com/chain/add-network-to-wallet/
 */
export const robinhoodChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mainnet.chain.robinhood.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Chain Explorer',
      url: 'https://robinhoodchain.blockscout.com',
    },
  },
});

/**
 * Robinhood Chain Testnet is not yet included in viem/chains.
 * Network details: https://docs.robinhood.com/chain/add-network-to-wallet/
 */
export const robinhoodChainTestnet = defineChain({
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.chain.robinhood.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Chain Testnet Explorer',
      url: 'https://explorer.testnet.chain.robinhood.com',
    },
  },
});

const ALL_CHAINS = [
  ...Object.values(chains),
  robinhoodChain,
  robinhoodChainTestnet,
];

const DEFAULT_CHAINS = [chains.sepolia];

const supportedChainsString = import.meta.env.VITE_SUPPORTED_CHAINS;

export const supportedChains: Chain[] = supportedChainsString
  ? supportedChainsString.split(',').map((chainIdString) => {
      const chainId = parseInt(chainIdString);
      const chain = extractChain({
        chains: ALL_CHAINS,
        id: chainId as any,
      });

      if (!chain) {
        throw new Error(`Chain ${chainId} not found`);
      }

      return chain;
    })
  : DEFAULT_CHAINS;

const firstSupportedChain = supportedChains[0];

if (!firstSupportedChain) {
  throw new Error('No supported chains found.');
}

export const defaultSupportedChain: Chain = firstSupportedChain;
