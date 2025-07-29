import type { CaipAssetType, Hex } from '@metamask/utils';
import { Caip10Address } from '../core/types';
import { ZERO_ADDRESS } from '../constants';

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

  let [assetType, assetAddress] = secondHalf.split(':');
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
