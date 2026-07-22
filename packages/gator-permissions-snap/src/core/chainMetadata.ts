import type { Hex } from '@metamask/delegation-core';
import {
  CHAIN_ID,
  DELEGATOR_CONTRACTS,
} from '@metamask/delegation-deployments';
import { numberToHex } from '@metamask/utils';

import { t } from '../utils/i18n';

export type DelegationContracts = {
  delegationManager: Hex;
  eip7702StatelessDeleGatorImpl: Hex;

  // Enforcers:
  limitedCallsEnforcer: Hex;
  erc20StreamingEnforcer: Hex;
  erc20PeriodTransferEnforcer: Hex;
  erc20TransferAmountEnforcer: Hex;
  nativeTokenStreamingEnforcer: Hex;
  nativeTokenPeriodTransferEnforcer: Hex;
  nativeTokenTransferAmountEnforcer: Hex;
  valueLteEnforcer: Hex;
  timestampEnforcer: Hex;
  exactCalldataEnforcer: Hex;
  nonceEnforcer: Hex;
  allowedCalldataEnforcer: Hex;
  redeemerEnforcer: Hex;
  allowedTargetsEnforcer: Hex;
  approvalRevocationEnforcer: Hex;
};

const DELEGATOR_CONTRACT_VERSION = '1.3.0';

type DeployedContracts = (typeof DELEGATOR_CONTRACTS)[string][number];

const getDeployedContracts = (chainId: number): DeployedContracts => {
  const deployedContractsByChainId =
    DELEGATOR_CONTRACTS[DELEGATOR_CONTRACT_VERSION];

  if (!deployedContractsByChainId) {
    throw new Error(
      `Delegator contract deployments are missing for version ${DELEGATOR_CONTRACT_VERSION}`,
    );
  }

  const deployedContracts =
    deployedContractsByChainId[chainId] ??
    deployedContractsByChainId[CHAIN_ID.mainnet];

  if (!deployedContracts) {
    throw new Error(
      `Delegator contract deployments are missing for chain ${chainId}`,
    );
  }

  return deployedContracts;
};

const getDeployedContractAddress = (
  deployedContracts: DeployedContracts,
  contractName: string,
): Hex => {
  const address = deployedContracts[contractName];

  if (!address) {
    throw new Error(`Delegator contract deployment is missing ${contractName}`);
  }

  return address;
};

const getContracts = (chainId: number): DelegationContracts => {
  const deployedContracts = getDeployedContracts(chainId);

  return {
    delegationManager: getDeployedContractAddress(
      deployedContracts,
      'DelegationManager',
    ),
    eip7702StatelessDeleGatorImpl: getDeployedContractAddress(
      deployedContracts,
      'EIP7702StatelessDeleGatorImpl',
    ),
    limitedCallsEnforcer: getDeployedContractAddress(
      deployedContracts,
      'LimitedCallsEnforcer',
    ),
    erc20StreamingEnforcer: getDeployedContractAddress(
      deployedContracts,
      'ERC20StreamingEnforcer',
    ),
    erc20PeriodTransferEnforcer: getDeployedContractAddress(
      deployedContracts,
      'ERC20PeriodTransferEnforcer',
    ),
    erc20TransferAmountEnforcer: getDeployedContractAddress(
      deployedContracts,
      'ERC20TransferAmountEnforcer',
    ),
    nativeTokenStreamingEnforcer: getDeployedContractAddress(
      deployedContracts,
      'NativeTokenStreamingEnforcer',
    ),
    nativeTokenPeriodTransferEnforcer: getDeployedContractAddress(
      deployedContracts,
      'NativeTokenPeriodTransferEnforcer',
    ),
    nativeTokenTransferAmountEnforcer: getDeployedContractAddress(
      deployedContracts,
      'NativeTokenTransferAmountEnforcer',
    ),
    valueLteEnforcer: getDeployedContractAddress(
      deployedContracts,
      'ValueLteEnforcer',
    ),
    timestampEnforcer: getDeployedContractAddress(
      deployedContracts,
      'TimestampEnforcer',
    ),
    exactCalldataEnforcer: getDeployedContractAddress(
      deployedContracts,
      'ExactCalldataEnforcer',
    ),
    nonceEnforcer: getDeployedContractAddress(
      deployedContracts,
      'NonceEnforcer',
    ),
    allowedCalldataEnforcer: getDeployedContractAddress(
      deployedContracts,
      'AllowedCalldataEnforcer',
    ),
    redeemerEnforcer: getDeployedContractAddress(
      deployedContracts,
      'RedeemerEnforcer',
    ),
    allowedTargetsEnforcer: getDeployedContractAddress(
      deployedContracts,
      'AllowedTargetsEnforcer',
    ),
    approvalRevocationEnforcer: getDeployedContractAddress(
      deployedContracts,
      'ApprovalRevocationEnforcer',
    ),
  };
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
  0x1237: {
    name: 'Robinhood Chain',
    explorerUrl: 'https://robinhoodchain.blockscout.com',
  },
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
  0xb626: {
    name: 'Robinhood Chain Testnet',
    explorerUrl: 'https://explorer.testnet.chain.robinhood.com',
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
    contracts: getContracts(chainId),
    name: name ?? t('unknownChain', [numberToHex(chainId)]),
    explorerUrl,
  };

  return metadata;
};
