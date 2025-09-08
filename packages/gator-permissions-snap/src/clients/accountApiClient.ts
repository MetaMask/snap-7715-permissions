import { zAddress } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import { type Hex } from '@metamask/delegation-core';
import { InvalidInputError, ResourceNotFoundError } from '@metamask/snaps-sdk';
import { z } from 'zod';

import { ZERO_ADDRESS } from '../constants';
import type { TokenBalanceAndMetadata, RetryOptions } from './types';
import { makeValidatedRequestWithRetry } from '../utils/httpClient';

/**
 * Zod schema for validating individual token balance item
 */
const TokenBalanceItemSchema = z.object({
  object: z.literal('token'),
  address: zAddress,
  symbol: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9]+$/iu, 'Symbol must contain only alphanumeric characters'),
  decimals: z.number().int().min(0).max(77), // ERC-20 standard allows up to 77 decimals
  name: z.string().min(1).max(100),
  type: z.string().min(1).max(20).optional(), // Only present for native tokens
  occurrences: z.number().nonnegative(),
  balance: z.string().regex(/^\d+\.?\d*$/u, 'Balance must be a numeric string'),
  chainId: z.number().int().positive(),
});

/**
 * Zod schema for validating token balance response
 */
const TokenBalanceResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  balances: z.array(TokenBalanceItemSchema),
  unprocessedNetworks: z.array(z.unknown()),
});

export type TokenBalanceResponse = z.infer<typeof TokenBalanceResponseSchema>;

/**
 * Zod schema for validating token metadata response
 */
const TokenMetadataResponseSchema = z.object({
  address: zAddress,
  chainId: z.number().int().positive(),
  decimals: z.number().int().min(0).max(77),
  iconUrl: z.string().url().max(2048).optional(),
  name: z.string().min(1).max(100),
  symbol: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9]+$/iu, 'Symbol must contain only alphanumeric characters'),
});

export type TokenMetadataResponse = z.infer<typeof TokenMetadataResponseSchema>;

/**
 * Configuration options for AccountApiClient
 */
export type AccountApiClientConfig = {
  accountBaseUrl: string;
  tokensBaseUrl: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs: number;
  maxResponseSizeBytes: number;
};

/**
 * Class responsible for fetching account data from the Account API.
 */
export class AccountApiClient {
  static readonly #nativeTokenAddress = ZERO_ADDRESS;

  readonly #fetch: typeof globalThis.fetch;

  readonly #accountBaseUrl: string;

  readonly #tokensBaseUrl: string;

  readonly #timeoutMs: number;

  readonly #maxResponseSizeBytes: number;

  constructor({
    accountBaseUrl,
    tokensBaseUrl,
    fetch = globalThis.fetch,
    timeoutMs,
    maxResponseSizeBytes,
  }: AccountApiClientConfig) {
    this.#fetch = fetch;
    this.#accountBaseUrl = accountBaseUrl.replace(/\/+$/u, ''); // Remove trailing slashes
    this.#tokensBaseUrl = tokensBaseUrl.replace(/\/+$/u, ''); // Remove trailing slashes
    this.#timeoutMs = timeoutMs;
    this.#maxResponseSizeBytes = maxResponseSizeBytes;
  }

  /**
   * Checks if a chain ID is supported by the account API.
   *
   * @param params - The parameters object.
   * @param params.chainId - The chain ID to check.
   * @returns True if the chain ID is supported, false otherwise.
   */
  public isChainIdSupported({ chainId }: { chainId: number }): boolean {
    return [
      1, // mainnet
      10, // OP Mainnet
      1329, // Sei Network
      137, // Polygon Mainnet
      42161, // Arbitrum One
      534352, // Scroll Mainnet
      56, // BSC Mainnet
      59144, // Linea Mainnet
      8453, // Base Mainnet
    ].includes(chainId);
  }

  /**
   * Fetch the token balance for a given account and token. If the request fails, it will retry
   * according to the retryOptions configuration.
   *
   * @param params - The parameters for fetching the token balance.
   * @param params.chainId - The chain ID to fetch the balance from.
   * @param params.assetAddress - The token address to fetch the balance for. If not provided, fetches native token balance.
   * @param params.account - The account address to fetch the balance for.
   * @param params.retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
   * @returns The token balance as BigInt.
   */
  public async getTokenBalance({
    chainId,
    assetAddress,
    account,
    retryOptions,
  }: {
    chainId: number;
    account: Hex;
    assetAddress?: Hex | undefined;
    retryOptions?: RetryOptions;
  }): Promise<bigint> {
    if (!chainId) {
      const message = 'No chainId provided to fetch token balance';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    if (!account) {
      const message = 'No account address provided to fetch token balance';
      logger.error(message);
      throw new InvalidInputError(message);
    }
    const tokenAddress = assetAddress ?? AccountApiClient.#nativeTokenAddress;

    // Try up to initial attempt + retry attempts
    const response = await this.#fetchTokenBalance(
      tokenAddress,
      account,
      chainId,
      retryOptions,
    );

    // Parse and validate the response
    const { balances, count } = response;

    // If count is 0 or balances array is empty, it means the token has no balance (0 balance)
    if (count === 0 || balances.length === 0) {
      logger.info(
        `No balance found for token ${tokenAddress} on account ${account}`,
      );
      return BigInt(0);
    }

    // Find the token in the balances array
    const tokenData = balances.find(
      (token) => token.address.toLowerCase() === tokenAddress.toLowerCase(),
    );

    if (!tokenData) {
      logger.error(`Token ${tokenAddress} not found in balance response`);
      throw new ResourceNotFoundError(
        `Token ${tokenAddress} not found in balance response`,
      );
    }

    // Convert balance string to BigInt
    // The balance comes as a decimal string in the smallest unit (e.g., wei for ETH, smallest unit for tokens)
    // We need to handle the decimal part properly
    const balanceValue = parseFloat(tokenData.balance);
    return BigInt(Math.floor(balanceValue));
  }

  /**
   * Fetch the token metadata for a given token. If the request fails, it will retry
   * according to the retryOptions configuration.
   *
   * @param params - The parameters for fetching the token metadata.
   * @param params.chainId - The chain ID to fetch metadata from.
   * @param params.assetAddress - The token address to fetch metadata for. If not provided, fetches native token metadata.
   * @param params.retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
   * @returns The token metadata.
   */
  public async getTokenMetadata({
    chainId,
    assetAddress,
    retryOptions,
  }: {
    chainId: number;
    assetAddress?: Hex | undefined;
    retryOptions?: RetryOptions;
  }): Promise<{ decimals: number; symbol: string; iconUrl?: string }> {
    if (!chainId) {
      const message = 'No chainId provided to fetch token metadata';
      logger.error(message);
      throw new InvalidInputError(message);
    }
    const tokenAddress = assetAddress ?? AccountApiClient.#nativeTokenAddress;

    const tokenMetadata = await this.#fetchTokenMetadata(
      tokenAddress,
      chainId,
      retryOptions,
    );

    return {
      decimals: tokenMetadata.decimals,
      symbol: tokenMetadata.symbol,
      ...(tokenMetadata.iconUrl && { iconUrl: tokenMetadata.iconUrl }),
    };
  }

  /**
   * Fetch the token balance and metadata for a given account and token. If the request fails, it will retry
   * according to the retryOptions configuration.
   *
   * @param params - The parameters for fetching the token balance.
   * @param params.chainId - The chain ID to fetch the balance from.
   * @param params.assetAddress - The token address to fetch the balance for. If not provided, fetches native token balance.
   * @param params.account - The account address to fetch the balance for.
   * @param params.retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
   * @returns The token balance and metadata.
   */
  public async getTokenBalanceAndMetadata({
    chainId,
    assetAddress,
    account,
    retryOptions,
  }: {
    chainId: number;
    account: Hex;
    assetAddress?: Hex | undefined;
    retryOptions?: RetryOptions;
  }): Promise<TokenBalanceAndMetadata> {
    // Fetch balance and metadata in parallel for better performance
    const balancePromise = retryOptions
      ? this.getTokenBalance({ chainId, assetAddress, account, retryOptions })
      : this.getTokenBalance({ chainId, assetAddress, account });

    const metadataPromise = retryOptions
      ? this.getTokenMetadata({ chainId, assetAddress, retryOptions })
      : this.getTokenMetadata({ chainId, assetAddress });

    const [balance, metadata] = await Promise.all([
      balancePromise,
      metadataPromise,
    ]);

    return {
      balance,
      decimals: metadata.decimals,
      symbol: metadata.symbol,
      ...(metadata.iconUrl && { iconUrl: metadata.iconUrl }),
    };
  }

  /**
   * Internal method to fetch token balance and return the raw response.
   * @param tokenAddress - The token address to fetch the balance for.
   * @param account - The account address to fetch the balance for.
   * @param chainId - The chain ID to fetch the balance from.
   * @param retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
   * @returns The validated token balance response.
   */
  async #fetchTokenBalance(
    tokenAddress: Hex,
    account: Hex,
    chainId: number,
    retryOptions?: RetryOptions,
  ): Promise<TokenBalanceResponse> {
    const url = `${this.#accountBaseUrl}/v2/accounts/${account}/balances?networks=${chainId}&filterSupportedTokens=false&includeTokenAddresses=${tokenAddress}&includeStakedAssets=false`;

    return (await makeValidatedRequestWithRetry(
      url,
      {
        timeoutMs: this.#timeoutMs,
        maxResponseSizeBytes: this.#maxResponseSizeBytes,
        fetch: this.#fetch,
      },
      TokenBalanceResponseSchema,
      retryOptions,
    )) as TokenBalanceResponse;
  }

  /**
   * Internal method to fetch token metadata from the tokens API.
   * @param tokenAddress - The token address to fetch metadata for.
   * @param chainId - The chain ID to fetch metadata from.
   * @param retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
   * @returns The raw fetch response.
   */
  async #fetchTokenMetadata(
    tokenAddress: Hex,
    chainId: number,
    retryOptions?: RetryOptions,
  ): Promise<TokenMetadataResponse> {
    const url = `${this.#tokensBaseUrl}/token/${chainId}?address=${tokenAddress}&includeEnrichedData=false&includeCoingeckoId=false&includeAggregators=false&includeOccurrences=false&includeIconUrl=true&includeAssetType=false&includeTokenFees=false&includeHoneypotStatus=false&includeContractVerificationStatus=false&includeStorage=false&includeERC20Permit=false&includeDescription=false`;

    return (await makeValidatedRequestWithRetry(
      url,
      {
        timeoutMs: this.#timeoutMs,
        maxResponseSizeBytes: this.#maxResponseSizeBytes,
        fetch: this.#fetch,
      },
      TokenMetadataResponseSchema,
      retryOptions,
    )) as TokenMetadataResponse;
  }
}
