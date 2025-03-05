import * as chains from 'viem/chains';

export const getChainName = (chainId: number): string => {
  const chain = Object.values(chains).find(
    (foundChain) => 'id' in foundChain && foundChain.id === chainId,
  );
  if (!chain) {
    throw new Error(`Chain with id ${chainId} not found`);
  }

  return chain.name;
};
