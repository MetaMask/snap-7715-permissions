import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/delegation-core';

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

/**
 * Service responsible for fetching token balance and metadata.
 */
export class TokenMetadataService {
  readonly #accountApiClient: AccountApiClient;

  readonly #tokenMetadataClient: TokenMetadataClient;

  readonly #fetcher: typeof fetch;

  /**
   * Initializes a new TokenMetadataService instance.
   *
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
  }

  /**
   * Gets the appropriate token metadata client for the given chain ID.
   * Uses the account API client for mainnet (chain ID 1) and the blockchain client for other chains.
   *
   * @param config - The configuration object.
   * @param config.chainId - The chain ID to get the client for.
   * @returns The appropriate token metadata client.
   */
  #getTokenMetadataClientForChainId(config: {
    chainId: number;
  }): TokenMetadataClient {
    if (this.#accountApiClient.isChainIdSupported(config)) {
      return this.#accountApiClient;
    }

    return this.#tokenMetadataClient;
  }

  /**
   * Retrieves the token balance and metadata for the specified account.
   *
   * @param options - The options for fetching the token balance and metadata.
   * @returns A promise resolving to the token balance and metadata.
   */
  public async getTokenBalanceAndMetadata(
    options: GetTokenBalanceAndMetadataOptions,
  ): Promise<TokenBalanceAndMetadata> {
    logger.debug('TokenMetadataService:getTokenBalanceAndMetadata()');

    const { chainId, account, assetAddress } = options;

    const client = this.#getTokenMetadataClientForChainId({ chainId });

    const balanceAndMetadata = await client.getTokenBalanceAndMetadata({
      chainId,
      account,
      assetAddress,
    });

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
   *
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
    } catch (error) {
      logger.error('Error fetching icon data', error);
      return { success: false };
    }
  }
}
