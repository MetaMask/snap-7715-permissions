import {
  parseCaipAssetType,
  type CaipAssetType,
  type CaipChainId,
} from '@metamask/utils';

const explorerMap: Record<CaipChainId, string> = {
  'eip155:1': 'https://etherscan.io',
  'eip155:11155111': 'https://sepolia.etherscan.io',
  // add more as needed
};

type ExplorerResult = {
  url?: string;
  address?: string;
};

/**
 * Get the explorer URL and address for a given asset token.
 * @param assetToken - The CAIP-19 asset token.
 * @returns An object containing the explorer URL and address.
 * @throws Will throw an error if the asset token cannot be parsed or if the chain ID is unsupported.
 */
export function getExplorerUrlAndAddress(
  assetToken: CaipAssetType,
): ExplorerResult {
  const result: ExplorerResult = {};
  try {
    const { chainId, assetReference, assetNamespace } =
      parseCaipAssetType(assetToken);
    const baseUrl = explorerMap[chainId];
    if (!baseUrl) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Handle by assetNamespace
    if (assetNamespace === 'erc20') {
      if (!assetReference) {
        throw new Error(`Invalid asset reference for token: ${assetToken}`);
      }
      result.url = `${baseUrl}/address/${assetReference}`;
      result.address = assetReference;
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to parse asset token: ${String(error)}`);
  }
}
