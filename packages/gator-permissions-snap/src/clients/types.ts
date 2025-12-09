import type { Hex } from '@metamask/delegation-core';
import type { CaipAssetType } from '@metamask/utils';

/**
 * Options for configuring retry behavior.
 */
export type RetryOptions = {
  /** Number of retry attempts. */
  retries?: number;
  /** Delay between retries in milliseconds. */
  delayMs?: number;
};

/**
 * The params for the price API client to fetch spot prices.
 */
export type VsCurrencyParam =
  | 'btc'
  | 'eth'
  | 'ltc'
  | 'bch'
  | 'bnb'
  | 'eos'
  | 'xrp'
  | 'xlm'
  | 'link'
  | 'dot'
  | 'yfi'
  | 'usd'
  | 'aed'
  | 'ars'
  | 'aud'
  | 'bdt'
  | 'bhd'
  | 'bmd'
  | 'brl'
  | 'cad'
  | 'chf'
  | 'clp'
  | 'cny'
  | 'czk'
  | 'dkk'
  | 'eur'
  | 'gbp'
  | 'gel'
  | 'hkd'
  | 'huf'
  | 'idr'
  | 'ils'
  | 'inr'
  | 'jpy'
  | 'krw'
  | 'kwd'
  | 'lkr'
  | 'mmk'
  | 'mxn'
  | 'myr'
  | 'ngn'
  | 'nok'
  | 'nzd'
  | 'php'
  | 'pkr'
  | 'pln'
  | 'rub'
  | 'sar'
  | 'sek'
  | 'sgd'
  | 'thb'
  | 'try'
  | 'twd'
  | 'uah'
  | 'vef'
  | 'vnd'
  | 'zar'
  | 'xdr'
  | 'xag'
  | 'xau'
  | 'bits'
  | 'sats';

/**
 * The response for the spot prices API.
 */
export type SpotPricesRes = Record<
  CaipAssetType,
  Record<VsCurrencyParam, number>
>;

/**
 * Represents token balance and metadata information
 */
export type TokenBalanceAndMetadata = {
  balance: bigint;
  decimals: number;
  symbol: string;
  iconUrl?: string;
};

/**
 * Represents a transaction receipt from the blockchain.
 * As defined in the Ethereum JSON-RPC API(https://docs.metamask.io/services/reference/zksync/json-rpc-methods/eth_gettransactionreceipt/)
 */
export type TransactionReceipt = {
  blockHash: Hex;
  blockNumber: Hex;
  contractAddress: Hex | null;
  cumulativeGasUsed: Hex;
  effectiveGasPrice: Hex;
  from: Hex;
  gasUsed: Hex;
  logs: {
    address: Hex;
    blockHash: Hex;
    blockNumber: Hex;
    data: Hex;
    logIndex: Hex;
    removed: boolean;
    topics: Hex[];
    transactionHash: Hex;
    transactionIndex: Hex;
  }[];
  logsBloom: Hex;
  status: Hex;
  to: Hex;
  transactionHash: Hex;
  transactionIndex: Hex;
  type: Hex;
};

/**
 * Interface for token metadata clients that can fetch token balance and metadata
 */
export type TokenMetadataClient = {
  /**
   * Fetch the token balance and metadata for a given account and token.
   * @param params - The parameters for fetching the token balance
   * @param params.chainId - The chain ID to fetch the balance from
   * @param params.assetAddress - The token address to fetch the balance for. If not provided, fetches native token balance
   * @param params.account - The account address to fetch the balance for
   * @returns The token balance and metadata
   */
  getTokenBalanceAndMetadata(params: {
    chainId: number;
    account: Hex;
    assetAddress?: Hex | undefined;
  }): Promise<TokenBalanceAndMetadata>;
};
