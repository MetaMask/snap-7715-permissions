/**
 * Optional inputs for permission `getSupportedChains`.
 * Native-token-swap may use these to narrow chains in the future; other types ignore them.
 */
export type GetSupportedChainsOptions = {
  tokenMetadata?: {
    decimals: number;
    symbol: string;
    iconDataBase64: string | null;
  };
};

// Ensures this file is unambiguously an ES module (see import-x/unambiguous).
export {};
