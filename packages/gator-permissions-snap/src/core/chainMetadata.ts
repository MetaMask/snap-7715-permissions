import type { Hex } from '@metamask/delegation-core';
import { numberToHex } from '@metamask/utils';

import { t } from '../utils/i18n';

/**
 * EIP-155 chain IDs with name/explorer metadata in this snap.
 *
 * @see https://chainid.network/chains.json
 */
export enum GatorChainId {
  EthereumMainnet = 0x1,
  OpMainnet = 0xa,
  BnbSmartChainMainnet = 0x38,
  Gnosis = 0x64,
  Unichain = 0x82,
  PolygonMainnet = 0x89,
  Base = 0x2105,
  ArbitrumOne = 0xa4b1,
  ArbitrumNova = 0xa4ba,
  LineaMainnet = 0xe708,
  Amoy = 0x13882,
  Berachain = 0x138de,
  BnbSmartChainTestnet = 0x61,
  UnichainSepoliaTestnet = 0x515,
  MegaEthTestnet = 0x18c6,
  GnosisChiadoTestnet = 0x27d8,
  LineaSepoliaTestnet = 0xe705,
  BerachainBepoliaTestnet = 0x138c5,
  BaseSepoliaTestnet = 0x14a34,
  ArbitrumSepoliaTestnet = 0x66eee,
  EthereumSepoliaTestnet = 0xaa36a7,
  OpSepoliaTestnet = 0xaa37dc,
}

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
  allowedCalldataEnforcer: Hex;
  argsEqualityEnforcer: Hex;
  nativeTokenTransferAmountEnforcer: Hex;
  redeemerEnforcer: Hex;
  /** Present when a native-token-swap adapter is deployed on this chain. */
  nativeTokenSwapAdapter?: Hex;
};

const NATIVE_TOKEN_SWAP_ADAPTER_BY_CHAIN_ID: Partial<
  Record<GatorChainId, Hex>
> = {
  [GatorChainId.EthereumMainnet]: '0xe41eb5a3f6e35f1a8c77113f372892d09820c3fd',
  [GatorChainId.OpMainnet]: '0x5e4b49156D23D890e7DC264c378a443C2d22A80E',
  [GatorChainId.Base]: '0x5e4b49156D23D890e7DC264c378a443C2d22A80E',
  [GatorChainId.ArbitrumOne]: '0x5e4b49156D23D890e7DC264c378a443C2d22A80E',
  [GatorChainId.LineaMainnet]: '0x5e4b49156D23D890e7DC264c378a443C2d22A80E',
  [GatorChainId.BnbSmartChainMainnet]:
    '0x9c06653D3f1A331eAf4C3833F7235156e47305F1',
  [GatorChainId.PolygonMainnet]: '0x9c06653D3f1A331eAf4C3833F7235156e47305F1',
};

const delegationContracts: DelegationContracts = {
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
  allowedCalldataEnforcer: '0xc2b0d624c1c4319760C96503BA27C347F3260f55',
  argsEqualityEnforcer: '0x44B8C6ae3C304213c3e298495e12497Ed3E56E41',
  nativeTokenTransferAmountEnforcer:
    '0xF71af580b9c3078fbc2BBF16FbB8EEd82b330320',
  redeemerEnforcer: '0xE144b0b2618071B4E56f746313528a669c7E65c5',
};

export type ChainMetadata = {
  contracts: DelegationContracts;
  name: string;
  explorerUrl: string | undefined;
};

// derived from https://chainid.network/chains.json
export const nameAndExplorerUrlByChainId: Record<
  GatorChainId,
  Pick<ChainMetadata, 'name' | 'explorerUrl'>
> = {
  // mainnets
  [GatorChainId.EthereumMainnet]: {
    name: 'Ethereum Mainnet',
    explorerUrl: 'https://etherscan.io',
  },
  [GatorChainId.OpMainnet]: {
    name: 'OP Mainnet',
    explorerUrl: 'https://optimistic.etherscan.io',
  },
  [GatorChainId.BnbSmartChainMainnet]: {
    name: 'BNB Smart Chain Mainnet',
    explorerUrl: 'https://bscscan.com',
  },
  [GatorChainId.Gnosis]: {
    name: 'Gnosis',
    explorerUrl: 'https://gnosisscan.io',
  },
  [GatorChainId.Unichain]: {
    name: 'Unichain',
    explorerUrl: 'https://uniscan.xyz',
  },
  [GatorChainId.PolygonMainnet]: {
    name: 'Polygon Mainnet',
    explorerUrl: 'https://polygonscan.com',
  },
  [GatorChainId.Base]: {
    name: 'Base',
    explorerUrl: 'https://basescan.org',
  },
  [GatorChainId.ArbitrumOne]: {
    name: 'Arbitrum One',
    explorerUrl: 'https://arbiscan.io',
  },
  [GatorChainId.ArbitrumNova]: {
    name: 'Arbitrum Nova',
    explorerUrl: 'https://nova.arbiscan.io',
  },
  [GatorChainId.LineaMainnet]: {
    name: 'Linea Mainnet',
    explorerUrl: 'https://lineascan.build',
  },
  [GatorChainId.Amoy]: {
    name: 'Amoy',
    explorerUrl: 'https://amoy.polygonscan.com',
  },
  [GatorChainId.Berachain]: {
    name: 'Berachain',
    explorerUrl: 'https://berascan.com',
  },

  // testnets
  [GatorChainId.BnbSmartChainTestnet]: {
    name: 'BNB Smart Chain Testnet',
    explorerUrl: 'https://testnet.bscscan.com',
  },
  [GatorChainId.UnichainSepoliaTestnet]: {
    name: 'Unichain Sepolia Testnet',
    explorerUrl: 'https://unichain-sepolia.blockscout.com',
  },
  [GatorChainId.MegaEthTestnet]: {
    name: 'MegaETH Testnet',
    explorerUrl: undefined,
  },
  [GatorChainId.GnosisChiadoTestnet]: {
    name: 'Gnosis Chiado Testnet',
    explorerUrl: 'https://gnosis-chiado.blockscout.com',
  },
  [GatorChainId.LineaSepoliaTestnet]: {
    name: 'Linea Sepolia Testnet',
    explorerUrl: 'https://sepolia.lineascan.build',
  },
  [GatorChainId.BerachainBepoliaTestnet]: {
    name: 'Berachain Bepolia Testnet',
    explorerUrl: 'https://bepolia.beratrail.io',
  },
  [GatorChainId.BaseSepoliaTestnet]: {
    name: 'Base Sepolia Testnet',
    explorerUrl: 'https://sepolia.basescan.org',
  },
  [GatorChainId.ArbitrumSepoliaTestnet]: {
    name: 'Arbitrum Sepolia Testnet',
    explorerUrl: 'https://sepolia.arbiscan.io',
  },
  [GatorChainId.EthereumSepoliaTestnet]: {
    name: 'Ethereum Sepolia Testnet',
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  [GatorChainId.OpSepoliaTestnet]: {
    name: 'OP Sepolia Testnet',
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
  },
};

/**
 * Chain IDs with a deployed native-token-swap adapter, sorted ascending.
 *
 * @returns Numeric chain IDs.
 */
export function getNativeTokenSwapSupportedChainIds(): number[] {
  return Object.keys(NATIVE_TOKEN_SWAP_ADAPTER_BY_CHAIN_ID)
    .map((key) => Number(key))
    .sort((a, b) => a - b);
}

/**
 * Chain IDs listed in {@link nameAndExplorerUrlByChainId}, sorted ascending.
 *
 * @returns Numeric chain IDs.
 */
export function getConfiguredChainIds(): number[] {
  const ids = Object.values(GatorChainId).filter(
    (value): value is GatorChainId => typeof value === 'number',
  );

  return ids.sort((a, b) => a - b);
}

export const getChainMetadata = ({
  chainId,
}: {
  chainId: number;
}): ChainMetadata => {
  const { explorerUrl, name } =
    nameAndExplorerUrlByChainId[chainId as GatorChainId] ?? {};
  const nativeTokenSwapAdapter =
    NATIVE_TOKEN_SWAP_ADAPTER_BY_CHAIN_ID[chainId as GatorChainId];

  const mergedContracts: DelegationContracts =
    nativeTokenSwapAdapter === undefined
      ? { ...delegationContracts }
      : { ...delegationContracts, nativeTokenSwapAdapter };

  const metadata: ChainMetadata = {
    contracts: mergedContracts,
    name: name ?? t('unknownChain', [numberToHex(chainId)]),
    explorerUrl,
  };

  return metadata;
};
