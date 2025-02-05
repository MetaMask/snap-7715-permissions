import { custom } from 'viem';

/**
 * Ethereum provider for Snap viem transport
 */
export const snapTansport = custom(ethereum, {
  name: 'Snap Ethereum Provider',
});
