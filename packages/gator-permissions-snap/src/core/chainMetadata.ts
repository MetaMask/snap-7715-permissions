import type { Hex } from '@metamask/delegation-core';
import { numberToHex } from '@metamask/utils';

export type DelegationContracts = {
  delegationManager: Hex;
  eip7702StatelessDeleGatorImpl: Hex;

  // Enforcers:
  limitedCallsEnforcer: Hex;
  erc20StreamingEnforcer: Hex;
  erc20PeriodTransferEnforcer: Hex;
  nativeTokenStreamingEnforcer: Hex;
  nativeTokenPeriodTransferEnforcer: Hex;
  valueLteEnforcer: Hex;
  timestampEnforcer: Hex;
  exactCalldataEnforcer: Hex;
  nonceEnforcer: Hex;
};

const contracts: DelegationContracts = {
  delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
  eip7702StatelessDeleGatorImpl: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B',
  limitedCallsEnforcer: '0x04658B29F6b82ed55274221a06Fc97D318E25416',
  erc20StreamingEnforcer: '0x56c97aE02f233B29fa03502Ecc0457266d9be00e',
  erc20PeriodTransferEnforcer: '0x474e3Ae7E169e940607cC624Da8A15Eb120139aB',
  nativeTokenStreamingEnforcer: '0xD10b97905a320b13a0608f7E9cC506b56747df19',
  nativeTokenPeriodTransferEnforcer:
    '0x9BC0FAf4Aca5AE429F4c06aEEaC517520CB16BD9',
  valueLteEnforcer: '0x92Bf12322527cAA612fd31a0e810472BBB106A8F',
  timestampEnforcer: '0x1046bb45C8d673d4ea75321280DB34899413c069',
  exactCalldataEnforcer: '0x99F2e9bF15ce5eC84685604836F71aB835DBBdED',
  nonceEnforcer: '0xDE4f2FAC4B3D87A1d9953Ca5FC09FCa7F366254f',
};

// derived from https://chainid.network/chains.json
export const nameAndExplorerUrlByChainId: Record<
  number,
  Pick<ChainMetadata, 'name' | 'explorerUrl'>
> = {
  // mainnets
  0x1: { name: 'Ethereum Mainnet', explorerUrl: 'https://etherscan.io' },
  0xa: { name: 'OP Mainnet', explorerUrl: 'https://optimistic.etherscan.io' },
  0x38: { name: 'BNB Smart Chain Mainnet', explorerUrl: 'https://bscscan.com' },
  0x64: { name: 'Gnosis', explorerUrl: 'https://gnosisscan.io' },
  0x82: { name: 'Unichain', explorerUrl: 'https://uniscan.xyz' },
  0x89: { name: 'Polygon Mainnet', explorerUrl: 'https://polygonscan.com' },
  0x2105: { name: 'Base', explorerUrl: 'https://basescan.org' },
  0xa4b1: { name: 'Arbitrum One', explorerUrl: 'https://arbiscan.io' },
  0xa4ba: {
    name: 'Arbitrum Nova',
    explorerUrl: 'https://nova.arbiscan.io',
  },
  0xe708: {
    name: 'Linea Mainnet',
    explorerUrl: 'https://lineascan.build',
  },
  0x13882: { name: 'Amoy', explorerUrl: 'https://amoy.polygonscan.com' },
  0x138de: { name: 'Berachain', explorerUrl: 'https://berascan.com' },

  // testnets
  0x61: {
    name: 'BNB Smart Chain Testnet',
    explorerUrl: 'https://testnet.bscscan.com',
  },
  0x515: {
    name: 'Unichain Sepolia Testnet',
    explorerUrl: 'https://unichain-sepolia.blockscout.com',
  },
  0x18c6: { name: 'MegaETH Testnet', explorerUrl: undefined },
  0x27d8: {
    name: 'Gnosis Chiado Testnet',
    explorerUrl: 'https://gnosis-chiado.blockscout.com',
  },
  0xe705: {
    name: 'Linea Sepolia Testnet',
    explorerUrl: 'https://sepolia.lineascan.build',
  },
  0x138c5: {
    name: 'Berachain Bepolia Testnet',
    explorerUrl: 'https://bepolia.beratrail.io',
  },
  0x14a34: {
    name: 'Base Sepolia Testnet',
    explorerUrl: 'https://sepolia.basescan.org',
  },
  0x66eee: {
    name: 'Arbitrum Sepolia Testnet',
    explorerUrl: 'https://sepolia.arbiscan.io',
  },
  0xaa36a7: {
    name: 'Ethereum Sepolia Testnet',
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  0xaa37dc: {
    name: 'OP Sepolia Testnet',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
  },
};

export type ChainMetadata = {
  contracts: DelegationContracts;
  name: string;
  explorerUrl: string | undefined;
};

export const getChainMetadata = ({
  chainId,
}: {
  chainId: number;
}): ChainMetadata => {
  const { explorerUrl, name } = nameAndExplorerUrlByChainId[chainId] ?? {};

  const metadata = {
    contracts,
    name: name ?? `Unknown chain ${numberToHex(chainId)}`,
    explorerUrl,
  };

  return metadata;
};
