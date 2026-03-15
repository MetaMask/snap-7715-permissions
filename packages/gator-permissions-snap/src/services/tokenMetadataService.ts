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
};

type CacheKey = `${number}-${string}`;

/**
 * Service responsible for fetching token balance and metadata.
 */
export class TokenMetadataService {
  readonly #accountApiClient: AccountApiClient;

  readonly #tokenMetadataClient: TokenMetadataClient;

  readonly #fetcher: typeof fetch;

  readonly #metadataCache: Map<CacheKey, TokenMetadata>;

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
    this.#metadataCache = new Map();
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
    return `${chainId}-${assetAddress ?? 'native'}` as CacheKey;
  }

  /**
   * Fetches token data from available clients with fallback support.
   * Tries multiple clients in order of preference. If a client fails,
   * automatically falls back to the next available client.
   * Also caches the metadata portion for future use.
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

        // Cache the metadata portion for future use
        const cacheKey = this.#createCacheKey(chainId, assetAddress);
        this.#metadataCache.set(cacheKey, {
          symbol: balanceAndMetadata.symbol,
          decimals: balanceAndMetadata.decimals,
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
   * Retrieves cached token metadata or fetches it if not cached.
   * Metadata (symbol, decimals) is static per token and safe to cache.
   * Concurrent requests for the same metadata share a single in-flight fetch.
   * @param options - The options for fetching the token metadata.
   * @returns A promise resolving to the token metadata.
   */
  public async getTokenMetadata(
    options: GetTokenBalanceAndMetadataOptions,
  ): Promise<TokenMetadata> {
    logger.debug('TokenMetadataService:getTokenMetadata()');

    const { chainId, assetAddress } = options;
    const cacheKey = this.#createCacheKey(chainId, assetAddress);

    // Check if we already have a cached result
    const cached = this.#metadataCache.get(cacheKey);
    if (cached) {
      logger.debug(
        'TokenMetadataService:getTokenMetadata() - returning cached metadata',
      );
      return cached;
    }

    // Check if we're already fetching this metadata (for concurrent requests)
    let promise = this.#metadataPromiseCache.get(cacheKey);
    if (promise) {
      logger.debug(
        'TokenMetadataService:getTokenMetadata() - returning in-flight fetch',
      );
      return promise;
    }

    // Start the fetch and cache the promise
    promise = this.#fetchTokenBalanceAndMetadata(options).then(
      (balanceAndMetadata) => {
        return {
          symbol: balanceAndMetadata.symbol,
          decimals: balanceAndMetadata.decimals,
        };
      },
    );

    this.#metadataPromiseCache.set(cacheKey, promise);

    // Once resolved, move it to the result cache and clean up promise cache
    return promise.then((result) => {
      this.#metadataCache.set(cacheKey, result);
      this.#metadataPromiseCache.delete(cacheKey);
      return result;
    });
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
  ): Promise<{ success: true; imageDataBase64: string } | { success: false }> {
    if (!iconUrl) {
      return { success: false };
    }

    try {
      const iconResponse = await this.#fetcher(iconUrl);
      if (!iconResponse.ok) {
        return { success: false };
      }

      const iconBuffer = await iconResponse.arrayBuffer();
      /* eslint-disable no-restricted-globals */
      const buffer = Buffer.from(iconBuffer);

      const imageDataBase64 = `data:image/png;base64,${buffer.toString('base64')}`;

      return { success: true, imageDataBase64 };
    } catch {
      logger.error('Error fetching icon data');
      return { success: false };
    }
  }
}
