import { logger } from '@metamask/7715-permissions-shared/utils';
import { type Hex } from '@metamask/delegation-core';

import { ZERO_ADDRESS } from '../constants';
import type { TokenBalanceAndMetadata } from './types';

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
   * @param params - The parameters object.
   * @param params.chainId - The chain ID to check.
   * @returns True if the chain ID is supported, false otherwise.
   */
  public isChainIdSupported({ chainId }: { chainId: number }): boolean {
    return chainId === 1;
  }

  /**
   * Fetch the token balance and metadata for a given account and token.
   * @param params - The parameters for fetching the token balance.
   * @param params.chainId - The chain ID to fetch the balance from.
   * @param params.assetAddress - The token address to fetch the balance for. If not provided, fetches native token balance.
   * @param params.account - The account address to fetch the balance for.
   * @returns The token balance and metadata.
   */
  public async getTokenBalanceAndMetadata({
    chainId,
    assetAddress,
    account,
  }: {
    chainId: number;
    account: Hex;
    assetAddress?: Hex | undefined;
  }): Promise<TokenBalanceAndMetadata> {
    if (!chainId) {
      const message = 'No chainId provided to fetch token balance';
      logger.error(message);

      throw new Error(message);
    }

    if (!account) {
      const message = 'No account address provided to fetch token balance';
      logger.error(message);

      throw new Error(message);
    }

    const tokenAddress = assetAddress ?? AccountApiClient.#nativeTokenAddress;

    const response = await this.#fetch(
      `${this.#baseUrl}/tokens/${tokenAddress}?accountAddresses=${account}&chainId=${chainId}`,
    );

    if (!response.ok) {
      const message = `HTTP error. Failed to fetch token balance for account(${account}) and token(${tokenAddress}) on chain(${chainId}): ${response.status}`;
      logger.error(message);

      throw new Error(message);
    }

    const { accounts, type, iconUrl, symbol, decimals } =
      (await response.json()) as TokenBalanceResponse;

    const accountLowercase = account.toLowerCase();
    const accountData = accounts.find(
      (acc) => acc.accountAddress.toLowerCase() === accountLowercase,
    );

    if (!accountData) {
      const message = `No balance data found for the account: ${account}`;
      logger.error(message);

      throw new Error(message);
    }

    if (
      type !== undefined &&
      !AccountApiClient.#supportedTokenTypes.includes(type)
    ) {
      const message = `Unsupported token type: ${type}`;
      logger.error(message);

      throw new Error(message);
    }

    const balance = BigInt(accountData.rawBalance);

    return {
      balance,
      decimals,
      symbol,
      iconUrl,
    };
  }
}
