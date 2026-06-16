import { extractChain } from 'viem';
import type { Chain } from 'viem';
import * as chains from 'viem/chains';

const ALL_CHAINS = [...Object.values(chains)];

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
