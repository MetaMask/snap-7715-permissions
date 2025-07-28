import type { Hex } from '@metamask/utils';

export const fromCaip10Address = (
  caip10Address: `${string}:${string}:${Hex}`,
) => {
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
