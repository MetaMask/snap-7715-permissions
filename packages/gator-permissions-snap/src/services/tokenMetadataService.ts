import { ZERO_ADDRESS } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/delegation-core';
import { InternalError } from '@metamask/snaps-sdk';

import type { AccountApiClient } from '../clients/accountApiClient';
import type {
  TokenBalanceAndMetadata,
  TokenMetadataClient,
} from '../clients/types';

export type GetTokenBalanceAndMetadataOptions = {
  chainId: number;
  account: Hex;
  assetAddress?: Hex;
};

export type TokenMetadata = {
  symbol: string;
  decimals: number;
  iconUrl?: string;
};

/**
 * Cache key format: `${chainId}-${assetAddress || 'native'}`
 * Example: "1-0xusdc..." or "1-native"
 */
type CacheKey = `${number}-${Hex | 'native'}`;

/**
 * Service responsible for fetching token balance and metadata.
 */
export class TokenMetadataService {
  readonly #accountApiClient: AccountApiClient;

  readonly #tokenMetadataClient: TokenMetadataClient;

  readonly #fetcher: typeof fetch;

  readonly #metadataPromiseCache: Map<CacheKey, Promise<TokenMetadata>>;

  /**
   * Initializes a new TokenMetadataService instance.
   * @param config - The configuration object.
   * @param config.accountApiClient - The client for interacting with the account API.
   * @param config.tokenMetadataClient - The client for interacting with the token metadata.
   * @param config.fetcher - The fetch function to use for HTTP requests.
   */
  constructor({
    accountApiClient,
    tokenMetadataClient,
    fetcher = fetch,
  }: {
    accountApiClient: AccountApiClient;
    tokenMetadataClient: TokenMetadataClient;
    fetcher?: typeof fetch;
  }) {
    this.#accountApiClient = accountApiClient;
    this.#tokenMetadataClient = tokenMetadataClient;
    this.#fetcher = fetcher;
    this.#metadataPromiseCache = new Map();
  }

  /**
   * Gets the ordered list of token metadata clients to try for the given chain ID.
   * Returns an array with preferred client(s) first, followed by fallback client(s).
   * For supported chains, tries Account API first, then blockchain client.
   * For unsupported chains, only uses blockchain client.
   * @param config - The configuration object.
   * @param config.chainId - The chain ID to get the clients for.
   * @returns Array of token metadata clients to try in order.
   */
  #getTokenMetadataClientForChainId(config: {
    chainId: number;
  }): TokenMetadataClient[] {
    if (this.#accountApiClient.isChainIdSupported(config)) {
      return [this.#accountApiClient, this.#tokenMetadataClient];
    }

    return [this.#tokenMetadataClient];
  }

  /**
   * Creates a cache key for storing token metadata.
   * @param chainId - The chain ID.
   * @param assetAddress - The asset address (or empty string for native token).
   * @returns The cache key.
   */
  #createCacheKey(chainId: number, assetAddress: Hex | undefined): CacheKey {
    return `${chainId}-${assetAddress ?? 'native'}`;
  }

  /**
   * Fetches token data from available clients with fallback support.
   * Tries multiple clients in order of preference. If a client fails,
   * automatically falls back to the next available client.
   * @param options - The options for fetching the token data.
   * @returns A promise resolving to the token balance and metadata.
   */
  async #fetchTokenBalanceAndMetadata(
    options: GetTokenBalanceAndMetadataOptions,
  ): Promise<TokenBalanceAndMetadata> {
    const { chainId, account, assetAddress } = options;
    const clients = this.#getTokenMetadataClientForChainId({ chainId });
    let lastError: unknown = new InternalError('No client found');

    for (const client of clients) {
      try {
        const balanceAndMetadata = await client.getTokenBalanceAndMetadata({
          chainId,
          account,
          assetAddress,
        });

        return balanceAndMetadata;
      } catch (error) {
        lastError = error;
        logger.info(
          `TokenMetadataService - client failed for chain ${chainId}`,
        );
      }
    }

    throw lastError;
  }

  /**
   * Fetches token metadata without requiring a balance lookup.
   * Prefers the Account API metadata endpoint when the chain is supported,
   * then falls back to balance+metadata clients.
   * @param options - Chain, asset, and optional account for fallback fetches.
   * @param options.chainId - The chain ID to fetch metadata from.
   * @param options.assetAddress - Optional ERC-20 token address; omit for native token.
   * @param options.account - Optional account used when falling back to balance clients.
   * @returns Token symbol, decimals, and optional icon URL.
   */
  async #fetchTokenMetadataOnly(options: {
    chainId: number;
    assetAddress?: Hex;
    account?: Hex;
  }): Promise<TokenMetadata> {
    const { chainId, assetAddress, account } = options;

    if (this.#accountApiClient.isChainIdSupported({ chainId })) {
      try {
        const metadata = await this.#accountApiClient.getTokenMetadata({
          chainId,
          ...(assetAddress !== undefined && { assetAddress }),
        });

        return {
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          ...(metadata.iconUrl !== undefined && { iconUrl: metadata.iconUrl }),
        };
      } catch {
        logger.info(
          `TokenMetadataService - Account API metadata fetch failed for chain ${chainId}`,
        );
      }
    }

    const balanceAndMetadata = await this.#fetchTokenBalanceAndMetadata({
      chainId,
      account: account ?? ZERO_ADDRESS,
      ...(assetAddress !== undefined && { assetAddress }),
    });

    return {
      symbol: balanceAndMetadata.symbol,
      decimals: balanceAndMetadata.decimals,
      ...(balanceAndMetadata.iconUrl !== undefined && {
        iconUrl: balanceAndMetadata.iconUrl,
      }),
    };
  }

  /**
   * Retrieves cached token metadata or fetches it if not cached.
   * Metadata (symbol, decimals) is static per token and safe to cache.
   * Concurrent requests for the same metadata share a single in-flight fetch.
   * @param options - The options for fetching the token metadata.
   * @returns A promise resolving to the token metadata.
   */
  public async getTokenMetadata(
    options: Omit<GetTokenBalanceAndMetadataOptions, 'account'> & {
      account?: Hex;
    },
  ): Promise<TokenMetadata> {
    logger.debug('TokenMetadataService:getTokenMetadata()');

    const { chainId, assetAddress } = options;
    const cacheKey = this.#createCacheKey(chainId, assetAddress);

    // Check if we're already fetching this metadata (for concurrent requests)
    let promise = this.#metadataPromiseCache.get(cacheKey);
    if (promise) {
      logger.debug(
        'TokenMetadataService:getTokenMetadata() - returning cached/in-flight metadata',
      );
      return promise;
    }

    // Start the fetch and cache the promise
    promise = this.#fetchTokenMetadataOnly({
      chainId,
      ...(assetAddress !== undefined && { assetAddress }),
      ...(options.account !== undefined && { account: options.account }),
    }).catch((error) => {
      logger.error(
        'TokenMetadataService:getTokenMetadata() - failed to fetch metadata',
        error,
      );
      this.#metadataPromiseCache.delete(cacheKey);
      throw error;
    });

    this.#metadataPromiseCache.set(cacheKey, promise);
    return promise;
  }

  /**
   * Retrieves the token balance and metadata for the specified account.
   * Tries multiple clients in order of preference. If a client fails,
   * automatically falls back to the next available client.
   * Balance is always fetched fresh, but metadata is cached for reuse.
   * @param options - The options for fetching the token balance and metadata.
   * @returns A promise resolving to the token balance and metadata.
   */
  public async getTokenBalanceAndMetadata(
    options: GetTokenBalanceAndMetadataOptions,
  ): Promise<TokenBalanceAndMetadata> {
    logger.debug('TokenMetadataService:getTokenBalanceAndMetadata()');

    const balanceAndMetadata =
      await this.#fetchTokenBalanceAndMetadata(options);

    logger.debug(
      'TokenMetadataService:getTokenBalanceAndMetadata() - balance and metadata resolved',
    );

    return balanceAndMetadata;
  }

  /**
   * Fetches an icon from a URL and converts it to a base64 data URI.
   *
   * This function downloads an image from the provided URL, converts the binary data
   * to a base64 string using a browser-compatible approach, and returns it as a
   * data URI with PNG MIME type.
   * @param iconUrl - The URL of the icon to fetch and convert.
   * @returns A Promise that resolves to a base64 data URI string, or undefined if iconUrl is empty.
   * @throws Will throw an error if the fetch request fails or if there's an issue processing the image data.
   */
  public async fetchIconDataAsBase64(
    iconUrl: string | undefined,
  ): Promise<
    { ok: true; imageDataBase64: string } | { ok: false; reason: string }
  > {
    if (!iconUrl) {
      return { ok: false, reason: 'Icon URL not provided' };
    }

    try {
      const iconResponse = await this.#fetcher(iconUrl);
      if (!iconResponse.ok) {
        return { ok: false, reason: 'Icon fetch failed' };
      }

      const iconBuffer = await iconResponse.arrayBuffer();
      /* eslint-disable no-restricted-globals */
      const buffer = Buffer.from(iconBuffer);

      const imageDataBase64 = `data:image/png;base64,${buffer.toString('base64')}`;

      return { ok: true, imageDataBase64 };
    } catch {
      logger.error('Error fetching icon data');
      return { ok: false, reason: 'Error fetching icon data' };
    }
  }
}
