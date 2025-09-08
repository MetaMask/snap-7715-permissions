import { zAddress } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import { type Hex } from '@metamask/delegation-core';
import {
  InternalError,
  InvalidInputError,
  ResourceNotFoundError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';
import { z } from 'zod';

import { ZERO_ADDRESS } from '../constants';
import type { TokenBalanceAndMetadata, RetryOptions } from './types';
import { makeValidatedRequest, sleep } from '../utils/httpClient';

/**
 * Zod schema for validating token balance response
 */
const TokenBalanceResponseSchema = z.object({
  name: z.string().min(1).max(100),
  symbol: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9]+$/iu, 'Symbol must contain only alphanumeric characters'),
  decimals: z.number().int().min(0).max(77), // ERC-20 standard allows up to 77 decimals
  type: z.string().min(1).max(20).optional(),
  iconUrl: z.string().url().max(2048).optional(), // Limit URL length and validate format
  coingeckoId: z.string().min(1).max(100),
  address: zAddress,
  occurrences: z.number().nonnegative(),
  sources: z.array(z.string().min(1).max(100)).max(50), // Limit number of sources
  chainId: z.number().int().positive(),
  blockNumber: z
    .string()
    .regex(
      /^(latest|\d+)$/u,
      'Block number must be "latest" or numeric string',
    ),
  updatedAt: z.string().datetime(),
  value: z.record(z.unknown()),
  price: z.number().finite().min(0),
  accounts: z
    .array(
      z.object({
        accountAddress: zAddress,
        chainId: z.number().int().positive(),
        rawBalance: z
          .string()
          .regex(/^\d+$/u, 'Raw balance must be numeric string'),
        balance: z.number().finite().min(0),
      }),
    )
    .min(1)
    .max(1000), // Ensure accounts is an array with reasonable limits
});

export type TokenBalanceResponse = z.infer<typeof TokenBalanceResponseSchema>;

/**
 * Configuration options for AccountApiClient
 */
export type AccountApiClientConfig = {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs: number;
  maxResponseSizeBytes: number;
};

/**
 * Class responsible for fetching account data from the Account API.
 */
export class AccountApiClient {
  static readonly #supportedTokenTypes = ['native', 'erc20'];

  static readonly #nativeTokenAddress = ZERO_ADDRESS;

  readonly #fetch: typeof globalThis.fetch;

  readonly #baseUrl: string;

  readonly #timeoutMs: number;

  readonly #maxResponseSizeBytes: number;

  constructor({
    baseUrl,
    fetch = globalThis.fetch,
    timeoutMs,
    maxResponseSizeBytes,
  }: AccountApiClientConfig) {
    this.#fetch = fetch;
    this.#baseUrl = baseUrl.replace(/\/+$/u, ''); // Remove trailing slashes
    this.#timeoutMs = timeoutMs;
    this.#maxResponseSizeBytes = maxResponseSizeBytes;
  }

  /**
   * Checks if a chain ID is supported by the account API.
   * Currently only mainnet (chain ID 1) is supported.
   *
   * @param params - The parameters object.
   * @param params.chainId - The chain ID to check.
   * @returns True if the chain ID is supported, false otherwise.
   */
  public isChainIdSupported({ chainId }: { chainId: number }): boolean {
    return chainId === 1;
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

    const { retries = 1, delayMs = 1000 } = retryOptions ?? {};
    const tokenAddress = assetAddress ?? AccountApiClient.#nativeTokenAddress;

    // Try up to initial attempt + retry attempts
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.#fetchTokenBalance(
          tokenAddress,
          account,
          chainId,
        );

        // Parse and validate the response
        const { accounts, type, iconUrl, symbol, decimals } = response;

        const accountLowercase = account.toLowerCase();
        const accountData = accounts.find(
          (acc) => acc.accountAddress.toLowerCase() === accountLowercase,
        );

        if (!accountData) {
          logger.error(`No balance data found for the account: ${account}`);
          throw new ResourceNotFoundError(
            `No balance data found for the account: ${account}`,
          );
        }

        if (
          type !== undefined &&
          !AccountApiClient.#supportedTokenTypes.includes(type)
        ) {
          logger.error(`Unsupported token type: ${type}`);
          throw new InvalidInputError(`Unsupported token type: ${type}`);
        }

        const balance = BigInt(accountData.rawBalance);

        return {
          balance,
          decimals,
          symbol,
          iconUrl,
        } as TokenBalanceAndMetadata;
      } catch (error) {
        // Check if this is a retryable error
        if (error instanceof ResourceUnavailableError && attempt < retries) {
          await sleep(delayMs);
          continue;
        }

        // If it's not retryable or we've exhausted retries, re-throw
        throw error;
      }
    }

    throw new InternalError(
      `Failed to fetch token balance after ${retries + 1} attempts`,
    );
  }

  /**
   * Internal method to fetch token balance and return the raw response.
   * @param tokenAddress - The token address to fetch the balance for.
   * @param account - The account address to fetch the balance for.
   * @param chainId - The chain ID to fetch the balance from.
   * @returns The validated token balance response.
   */
  async #fetchTokenBalance(
    tokenAddress: Hex,
    account: Hex,
    chainId: number,
  ): Promise<TokenBalanceResponse> {
    return (await makeValidatedRequest(
      `${this.#baseUrl}/tokens/${tokenAddress}?accountAddresses=${account}&chainId=${chainId}`,
      {
        timeoutMs: this.#timeoutMs,
        maxResponseSizeBytes: this.#maxResponseSizeBytes,
        fetch: this.#fetch,
      },
      TokenBalanceResponseSchema,
    )) as TokenBalanceResponse;
  }
}
