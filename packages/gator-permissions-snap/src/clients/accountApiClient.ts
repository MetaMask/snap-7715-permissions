import { logger } from '@metamask/7715-permissions-shared/utils';
import { type Hex } from '@metamask/delegation-core';
import {
  InvalidInputError,
  InternalError,
  ResourceNotFoundError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';

import { ZERO_ADDRESS } from '../constants';
import type { RetryOptions, TokenBalanceAndMetadata } from './types';
import { isResourceUnavailableStatus, sleep } from '../utils/retry';

/**
 * Response type for token balance data
 */
type TokenBalanceResponse = {
  name: string;
  symbol: string;
  decimals: number;
  type: string;
  iconUrl: string;
  coingeckoId: string;
  address: Hex;
  occurrences: number;
  sources: string[];
  chainId: number;
  blockNumber: string;
  updatedAt: string;
  value: Record<string, unknown>;
  price: number;
  accounts: {
    accountAddress: Hex;
    chainId: number;
    rawBalance: string;
    balance: number;
  }[];
};

/**
 * Class responsible for fetching account data from the Account API.
 */
export class AccountApiClient {
  static readonly #supportedTokenTypes = ['native', 'erc20'];

  static readonly #nativeTokenAddress = ZERO_ADDRESS;

  readonly #fetch: typeof globalThis.fetch;

  readonly #baseUrl: string;

  constructor({
    baseUrl,
    fetch = globalThis.fetch,
  }: {
    baseUrl: string;
    fetch?: typeof globalThis.fetch;
  }) {
    this.#fetch = fetch;
    this.#baseUrl = baseUrl.replace(/\/+$/u, ''); // Remove trailing slashes
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
      const response = await this.#fetchTokenBalance(
        tokenAddress,
        account,
        chainId,
      );

      // Process the response
      if (!response.ok) {
        logger.error(
          `HTTP error! Failed to fetch token balance for account(${account}) and token(${tokenAddress}) on chain(${chainId}): ${response.status}`,
        );

        // Check if this is a retryable error
        if (isResourceUnavailableStatus(response.status) && attempt < retries) {
          await sleep(delayMs);
          continue;
        }

        // Throw appropriate error based on status code
        if (response.status === 404) {
          throw new ResourceNotFoundError(
            `Token balance not found for account ${account} and token ${tokenAddress}`,
          );
        } else if (isResourceUnavailableStatus(response.status)) {
          throw new ResourceUnavailableError(
            `Account service temporarily unavailable (HTTP ${response.status})`,
          );
        } else {
          throw new InvalidInputError(
            `HTTP error ${response.status}: Failed to fetch token balance for account ${account} and token ${tokenAddress}`,
          );
        }
      }

      // Parse and validate the response
      const { accounts, type, iconUrl, symbol, decimals } =
        (await response.json()) as TokenBalanceResponse;

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
      };
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
   * @returns The raw fetch response.
   */
  async #fetchTokenBalance(
    tokenAddress: Hex,
    account: Hex,
    chainId: number,
  ): Promise<globalThis.Response> {
    try {
      return this.#fetch(
        `${this.#baseUrl}/tokens/${tokenAddress}?accountAddresses=${account}&chainId=${chainId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Error fetching token balance: ${errorMessage}`);
      throw new InternalError(`Error fetching token balance: ${errorMessage}`);
    }
  }
}
