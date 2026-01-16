import { zHexStr } from '@metamask/7715-permissions-shared/types';
import type { Hex } from '@metamask/delegation-core';
import type { CaipAssetType } from '@metamask/utils';
import { z } from 'zod';

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

// Zod schema for runtime validation of TransactionReceipt
export const zTransactionReceipt = z.object({
  blockHash: zHexStr,
  blockNumber: zHexStr,
  contractAddress: zHexStr.nullable(),
  cumulativeGasUsed: zHexStr,
  effectiveGasPrice: zHexStr,
  from: zHexStr,
  gasUsed: zHexStr,
  logs: z.array(
    z.object({
      address: zHexStr,
      blockHash: zHexStr,
      blockNumber: zHexStr,
      data: zHexStr,
      logIndex: zHexStr,
      removed: z.boolean(),
      topics: z.array(zHexStr),
      transactionHash: zHexStr,
      transactionIndex: zHexStr,
    }),
  ),
  logsBloom: zHexStr,
  status: zHexStr,
  to: zHexStr.nullable(),
  transactionHash: zHexStr,
  transactionIndex: zHexStr,
  type: zHexStr,
});

/**
 * Represents a transaction receipt from the blockchain.
 * As defined in the Ethereum JSON-RPC API(https://docs.metamask.io/services/reference/ethereum/json-rpc-methods/eth_gettransactionreceipt/)
 */
export type TransactionReceipt = z.infer<typeof zTransactionReceipt>;

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
