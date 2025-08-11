import type { Hex } from '@metamask/delegation-core';

export enum Enforcers {
  LimitedCallsEnforcer = 'LimitedCallsEnforcer',
  ERC20StreamingEnforcer = 'ERC20StreamingEnforcer',
  ERC20PeriodicTransferEnforcer = 'ERC20PeriodicTransferEnforcer',
  NativeTokenStreamingEnforcer = 'NativeTokenStreamingEnforcer',
  NativeTokenPeriodicTransferEnforcer = 'NativeTokenPeriodicTransferEnforcer',
  ValueLteEnforcer = 'ValueLteEnforcer',
  TimestampEnforcer = 'TimestampEnforcer',
  ExactCalldataEnforcer = 'ExactCalldataEnforcer',
  NonceEnforcer = 'NonceEnforcer',
}

export type DelegationContracts = {
  delegationManager: Hex;
  enforcers: Record<Enforcers, Hex>;
};

/**
 * Delegation contracts configuration for version 1.3.0.
 * Contains only contracts that are required within the snap.
 */

const CONTRACTS_1_3_0: DelegationContracts = {
  delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
  enforcers: {
    [Enforcers.LimitedCallsEnforcer]:
      '0x04658B29F6b82ed55274221a06Fc97D318E25416',
    [Enforcers.ERC20StreamingEnforcer]:
      '0x56c97aE02f233B29fa03502Ecc0457266d9be00e',
    [Enforcers.ERC20PeriodicTransferEnforcer]:
      '0x474e3Ae7E169e940607cC624Da8A15Eb120139aB',
    [Enforcers.NativeTokenStreamingEnforcer]:
      '0xD10b97905a320b13a0608f7E9cC506b56747df19',
    [Enforcers.NativeTokenPeriodicTransferEnforcer]:
      '0x9BC0FAf4Aca5AE429F4c06aEEaC517520CB16BD9',
    [Enforcers.ValueLteEnforcer]: '0x92Bf12322527cAA612fd31a0e810472BBB106A8F',
    [Enforcers.TimestampEnforcer]: '0x1046bb45C8d673d4ea75321280DB34899413c069',
    [Enforcers.ExactCalldataEnforcer]:
      '0x99F2e9bF15ce5eC84685604836F71aB835DBBdED',
    [Enforcers.NonceEnforcer]: '0xDE4f2FAC4B3D87A1d9953Ca5FC09FCa7F366254f',
  },
};

const metadataByChainId: Record<number, ChainMetadata> = {
  // mainnet
  1: {
    contracts: CONTRACTS_1_3_0,
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    decimals: 18,
    explorerUrl: 'https://etherscan.io',
  },
  // sepolia
  11155111: {
    contracts: CONTRACTS_1_3_0,
    name: 'Sepolia',
    symbol: 'ETH',
    decimals: 18,
    explorerUrl: 'https://sepolia.etherscan.io',
  },
};

export type ChainMetadata = {
  contracts: DelegationContracts;
  name: string;
  symbol: string;
  decimals: number;
  explorerUrl: string;
};

export const getChainMetadata = ({
  chainId,
}: {
  chainId: number;
}): ChainMetadata => {
  const metadata = metadataByChainId[chainId];

  if (!metadata) {
    throw new Error(`No chain metadata found for chainId: ${chainId}`);
  }

  return metadata;
};
