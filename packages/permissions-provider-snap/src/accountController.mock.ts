import type { DelegationStruct } from '@metamask-private/delegator-core-viem';
import type { Hex } from 'viem';
import { getAddress, parseUnits, toHex } from 'viem';

// Placeholde for the account controller
export type MockAccountController = {
  getAccountAddress: (options: { chainId: number }) => Promise<Hex>;
  signDelegation: (options: {
    chainId: number;
    delegation: DelegationStruct;
  }) => Promise<DelegationStruct>;
  getAccountMetadata: (options: { chainId: number }) => Promise<{
    factory: Hex | undefined;
    factoryData: Hex | undefined;
  }>;
  getAccountBalance: (options: { chainId: number }) => Promise<Hex>;
};

// Placeholder factory to create a mock account controller
export const createMockAccountController = (): MockAccountController => {
  const mockAccountsByChain: Record<number, Hex> = {
    11155111: getAddress('0x1234567890123456789012345678901234567890'),
  };
  return {
    getAccountAddress: async (_options) =>
      mockAccountsByChain[_options.chainId] ?? ('0x' as Hex),
    signDelegation: async (_options) => ({
      ..._options.delegation,
      signature: '0x00000000000000_SIGNED_DELEGATION',
    }),
    getAccountMetadata: async () => {
      return {
        factory: '0x1234567890123456789012345678901234567890',
        factoryData: '0x000000000000000000000000000000_factory_data',
      };
    },
    getAccountBalance: async (_options) => toHex(parseUnits('1', 18)), // 1 ether in wei
  };
};
