import type { CaipAssetType, Hex } from '@metamask/utils';

import { ZERO_ADDRESS } from '../constants';
import type { Caip10Address } from '../core/types';

/**
 * Parses a CAIP-10 address string into its components.
 * @param caip10Address - The CAIP-10 address string in the format 'chain:chainId:address'.
 * @returns An object containing the chain, chainId (as number), and address (as Hex).
 * @throws Error if the address is invalid (not eip155 or missing parts).
 */
export const fromCaip10Address = (caip10Address: Caip10Address) => {
  const [chain, chainId, address] = caip10Address.split(':');
  if (chain !== 'eip155' || chainId === undefined || address === undefined) {
    throw new Error('Invalid address');
  }

  return {
    chain,
    chainId: Number(chainId),
    address: address as Hex,
  };
};

/**
 * Constructs a CAIP-10 address string from its components.
 * @param options - Object with chain (optional, defaults to 'eip155'), chainId (number), and address (Hex).
 * @param options.chain - The chain of the address.
 * @param options.chainId - The chain ID of the address.
 * @param options.address - The address.
 * @returns The CAIP-10 address string.
 */
export const toCaip10Address = ({
  chain = 'eip155',
  chainId,
  address,
}: {
  chain?: string;
  chainId: number;
  address: Hex;
}) => {
  return `${chain}:${chainId}:${address}` as const;
};

/**
 * Parses a CAIP-19 asset type string into its components.
 * @param caip19Address - The CAIP-19 asset type string in the format 'chain:chainId/assetType:assetAddress'.
 * @returns An object containing chain, chainId (number), assetType, and assetAddress (Hex). For 'slip44', assetAddress is set to ZERO_ADDRESS.
 * @throws Error if the address is invalid.
 */
export const fromCaip19Address = (caip19Address: CaipAssetType) => {
  const [firstHalf, secondHalf] = caip19Address.split('/');

  if (firstHalf === undefined || secondHalf === undefined) {
    throw new Error('Invalid address');
  }

  const [chain, chainId] = firstHalf.split(':');
  if (chain !== 'eip155' || chainId === undefined) {
    throw new Error('Invalid address');
  }

  const parts = secondHalf.split(':');
  const [assetType] = parts;
  let [, assetAddress] = parts;

  if (assetType === undefined || assetAddress === undefined) {
    throw new Error('Invalid address');
  }

  if (assetType === 'slip44') {
    assetAddress = ZERO_ADDRESS;
  }

  return {
    chain,
    chainId: Number(chainId),
    assetType,
    assetAddress: assetAddress as Hex,
  };
};

/**
 * Constructs a CAIP-19 asset type string from the provided parameters.
 *
 * @param options - The options for constructing the CAIP-19 address.
 * @param options.chainId - The numeric chain ID (e.g., 1 for Ethereum mainnet).
 * @param options.address - The asset address as a Hex string.
 * @param options.assetType - The asset type (e.g., 'erc20', 'slip44').
 * @returns The CAIP-19 asset type string in the format 'eip155:chainId/assetType:address'.
 */
export const toCaip19Address = ({
  chainId,
  address,
  assetType,
}: {
  chainId: number;
  address: Hex;
  assetType: string;
}): CaipAssetType => {
  const identifier: CaipAssetType = `eip155:${chainId}/${assetType}:${address}`;
  return identifier;
};
