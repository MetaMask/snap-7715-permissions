import type { Hex } from '@metamask/delegation-core';
import { numberToHex } from '@metamask/utils';

export type DelegationContracts = {
  delegationManager: Hex;

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

const nameAndExplorerUrlByChainId: Record<
  number,
  Pick<ChainMetadata, 'name' | 'explorerUrl'>
> = {
  // Mainnets:
  1: {
    name: 'Ethereum Mainnet',
    explorerUrl: 'https://etherscan.io',
  },
  // Testnets:
  97: {
    name: 'BNB Smart Chain Testnet',
    explorerUrl: 'https://testnet.bscscan.com',
  },
  1301: {
    name: 'Unichain Sepolia Testnet',
    explorerUrl: 'https://sepolia.uniscan.xyz',
  },
  5115: {
    name: 'Citrea Testnet',
    explorerUrl: 'https://explorer.testnet.citrea.xyz',
  },
  6342: {
    name: 'MegaETH Testnet',
    explorerUrl: 'https://megaexplorer.xyz',
  },
  10200: {
    name: 'Gnosis Chiado Testnet',
    explorerUrl: 'https://gnosis-chiado.blockscout.com',
  },
  80002: {
    name: 'Polygon Amoy Testnet',
    explorerUrl: 'https://amoy.polygonscan.com/',
  },
  80069: {
    name: 'Berachain Bepolia Testnet',
    explorerUrl: 'https://bepolia.beratrail.io',
  },
  84532: {
    name: 'Base Sepolia Testnet',
    explorerUrl: 'https://sepolia.basescan.org',
  },
  421614: {
    name: 'Arbitrum Sepolia Testnet',
    explorerUrl: 'https://sepolia.arbiscan.io',
  },
  763373: {
    name: 'Ink Sepolia Testnet',
    explorerUrl: 'https://explorer-sepolia.inkonchain.com',
  },
  11155111: {
    name: 'Sepolia Testnet',
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  11155420: {
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
