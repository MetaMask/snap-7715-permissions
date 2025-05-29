import { logger } from '@metamask/7715-permissions-shared/utils';
import { isAddressEqual, zeroAddress, type Address } from 'viem';

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
  address: Address;
  occurrences: number;
  sources: string[];
  chainId: number;
  blockNumber: string;
  updatedAt: string;
  value: Record<string, unknown>;
  price: number;
  accounts: {
    accountAddress: Address;
    chainId: number;
    rawBalance: string;
    balance: number;
  }[];
};

export type TokenBalanceAndMetadata = {
  balance: bigint;
  decimals: number;
  symbol: string;
  iconUrl: string;
};

/**
 * Class responsible for fetching account data from the Account API.
 */
export class AccountApiClient {
  static readonly #supportedTokenTypes = ['native', 'erc20'];

  readonly #fetch: typeof globalThis.fetch;

  readonly #baseUrl: string;

  constructor(
    baseUrl: string,
    fetch: typeof globalThis.fetch = globalThis.fetch,
  ) {
    this.#fetch = fetch;
    this.#baseUrl = baseUrl.replace(/\/+$/u, ''); // Remove trailing slashes
  }

  /**
   * Fetch the token balance and metadata for a given account and token.
   *
   * @param params - The parameters for fetching the token balance
   * @param params.chainId - The chain ID to fetch the balance from
   * @param params.assetAddress - The token address to fetch the balance for. If not provided, fetches native token balance
   * @param params.account - The account address to fetch the balance for
   * @returns The token balance and metadata
   */
  public async getTokenBalanceAndMetadata({
    chainId,
    assetAddress,
    account,
  }: {
    chainId: number;
    assetAddress?: Address;
    account: Address;
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

    // zeroAddress is the native token on the specified chain
    const tokenAddress = assetAddress ?? zeroAddress;

    const response = await this.#fetch(
      `${this.#baseUrl}/tokens/${tokenAddress}?accountAddresses=${account}&chainId=${chainId}`,
    );

    if (!response.ok) {
      const message = `HTTP error. Failed to fetch token balance for account(${account}) and token(${tokenAddress}) on chain(${chainId}): ${response.status}`;
      logger.error(message);

      throw new Error(message);
    }

    const balanceData = (await response.json()) as TokenBalanceResponse;

    const accountData = balanceData.accounts.find((acc) =>
      isAddressEqual(acc.accountAddress, account),
    );

    if (!accountData) {
      const message = `No balance data found for the account: ${account}`;
      logger.error(message);

      throw new Error(message);
    }

    if (
      AccountApiClient.#supportedTokenTypes.indexOf(balanceData.type) === -1
    ) {
      const message = `Unsupported token type: ${balanceData.type}`;
      logger.error(message);

      throw new Error(message);
    }

    return {
      balance: BigInt(accountData.rawBalance),
      decimals: balanceData.decimals,
      symbol: balanceData.symbol,
      iconUrl: balanceData.iconUrl,
    };
  }
}
