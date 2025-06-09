import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Address } from 'viem';

import type { AccountApiClient } from '../clients/accountApiClient';
import type {
  TokenBalanceAndMetadata,
  TokenMetadataClient,
} from '../clients/types';

export type GetTokenBalanceAndMetadataOptions = {
  chainId: number;
  account: Address;
  assetAddress?: Address;
};

/**
 * Service responsible for fetching token balance and metadata.
 */
export class TokenMetadataService {
  readonly #accountApiClient: AccountApiClient;

  readonly #tokenMetadataClient: TokenMetadataClient;

  /**
   * Initializes a new TokenMetadataService instance.
   *
   * @param config - The configuration object.
   * @param config.accountApiClient - The client for interacting with the account API.
   * @param config.tokenMetadataClient - The client for interacting with the token metadata.
   */
  constructor({
    accountApiClient,
    tokenMetadataClient,
  }: {
    accountApiClient: AccountApiClient;
    tokenMetadataClient: TokenMetadataClient;
  }) {
    this.#accountApiClient = accountApiClient;
    this.#tokenMetadataClient = tokenMetadataClient;
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
}
