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
  },
};

const contractsByChainId: Record<number, DelegationContracts> = {
  // mainnet
  1: CONTRACTS_1_3_0,
  // sepolia
  11155111: CONTRACTS_1_3_0,
};

/**
 * Retrieves delegation contracts for a specific chain ID. Presently these are
 * hardcoded, but will be resolved from a configuration system such as
 * LaunchDarkly.
 *
 * @param params - The parameters object
 * @param params.chainId - The chain ID to get delegation contracts for
 * @returns The delegation contracts for the specified chain ID
 * @throws {Error} When no delegation contracts are found for the given chain ID
 */
export const getDelegationContracts = ({
  chainId,
}: {
  chainId: number;
}): DelegationContracts => {
  const contracts = contractsByChainId[chainId];

  if (!contracts) {
    throw new Error(`No delegation contracts found for chainId: ${chainId}`);
  }

  return contracts;
};
