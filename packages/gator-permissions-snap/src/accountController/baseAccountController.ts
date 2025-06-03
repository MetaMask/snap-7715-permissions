import { logger } from '@metamask/7715-permissions-shared/utils';
import { CHAIN_ID as ChainsWithDelegatorDeployed } from '@metamask/delegation-toolkit';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { Address } from 'viem';
import * as chains from 'viem/chains';

import type { AccountApiClient } from '../clients/accountApiClient';
import type {
  TokenMetadataClient,
  TokenBalanceAndMetadata,
} from '../core/types';
import type {
  AccountOptionsBase,
  GetTokenBalanceAndMetadataOptions,
} from './types';

export type SupportedChains =
  (typeof chains)[keyof typeof ChainsWithDelegatorDeployed &
    keyof typeof chains][];

// all of the chainIds that have delegator contracts deployed
type SupportedChainId = SupportedChains[number]['id'];

/**
 * Base class for account controllers that provides common functionality.
 */
export abstract class BaseAccountController {
  readonly #snapsProvider: SnapsProvider;

  readonly #accountApiClient: AccountApiClient;

  readonly #tokenMetadataClient: TokenMetadataClient;

  protected supportedChains: SupportedChains;

  // the intersection between chains supported by viem, and chains supported by the delegator contracts
  // chains is asserted to any here due to the inability to infer the namespace of the global import
  static #allSupportedChains = Object.keys(chains)
    .filter((name) => name in ChainsWithDelegatorDeployed)
    .map(
      (name) => (chains as any)[name as keyof typeof chains],
    ) as SupportedChains;

  /**
   * Initializes a new BaseAccountController instance.
   *
   * @param config - The configuration object.
   * @param config.snapsProvider - The provider for interacting with snaps.
   * @param config.supportedChains - The supported blockchain chains.
   * @param config.accountApiClient - The client for interacting with the account API.
   * @param config.tokenMetadataClient - The client for interacting with the token metadata.
   */
  constructor(config: {
    snapsProvider: SnapsProvider;
    supportedChains?: SupportedChains;
    accountApiClient: AccountApiClient;
    tokenMetadataClient: TokenMetadataClient;
  }) {
    // only validate if supportedChains is specified, as it will default to ALL_SUPPORTED_CHAINS
    if (config.supportedChains) {
      this.#validateSupportedChains(config.supportedChains);
    }

    this.#snapsProvider = config.snapsProvider;
    this.#accountApiClient = config.accountApiClient;
    this.#tokenMetadataClient = config.tokenMetadataClient;
    this.supportedChains =
      config.supportedChains ?? BaseAccountController.#allSupportedChains;
  }

  /**
   * Validates that the specified chains are supported.
   *
   * @param supportedChains - The chains to validate.
   * @throws If no chains are specified or if any chain is not supported.
   */
  #validateSupportedChains(supportedChains: SupportedChains) {
    if (supportedChains.length === 0) {
      logger.error('No supported chains specified');
      throw new Error('No supported chains specified');
    }

    // Get chain names from config and check if they're supported by delegator
    const configuredChains = Object.keys(chains)
      .filter((name) => {
        // assert chains to any here due to the inability to infer the namespace of the global import
        const chain = (chains as any)[name as keyof typeof chains];
        return supportedChains.some(
          (supportedChain) => supportedChain.id === chain.id,
        );
      })
      .map((name) => name.toLowerCase());

    const chainsWithDelegatorDeployed = Object.keys(
      ChainsWithDelegatorDeployed,
    ).map((name) => name.toLowerCase());

    const unsupportedChains = configuredChains.filter(
      (chain) => !chainsWithDelegatorDeployed.includes(chain),
    );

    if (unsupportedChains.length > 0) {
      logger.error('Unsupported chains specified', unsupportedChains);
      throw new Error(
        `Unsupported chains specified: ${unsupportedChains.join(', ')}`,
      );
    }
  }

  /**
   * Asserts that the specified chain ID is supported.
   *
   * @param chainId - The chain ID to validate.
   * @throws If the chain ID is not supported.
   */
  protected assertIsSupportedChainId(
    chainId: number,
  ): asserts chainId is SupportedChainId {
    if (!this.supportedChains.some((chain) => chain.id === chainId)) {
      logger.error(
        'accountController:assertIsSupportedChainId() - unsupported chainId',
        {
          chainId,
        },
      );
      throw new Error(`Unsupported ChainId: ${chainId}`);
    }
  }

  /**
   * Creates a provider that handles experimental provider requests.
   *
   * @param chainId - The chain ID for the provider.
   * @returns A provider object with a request method.
   */
  protected createExperimentalProviderRequestProvider(
    chainId: SupportedChainId,
  ) {
    return {
      request: async (request: { method: string; params?: unknown[] }) => {
        logger.debug(
          'accountController:createExperimentalProviderRequestProvider() - provider.request()',
          request,
        );

        // we can just pass the request to the snapsProvider, because
        // snap_experimentalProviderRequest enforces an allowlist of methods.
        const result = await this.#snapsProvider.request({
          // @ts-expect-error -- snap_experimentalProviderRequest are not defined in SnapMethods
          method: 'snap_experimentalProviderRequest',
          params: {
            // @ts-expect-error -- snap_experimentalProviderRequest are not defined in SnapMethods
            chainId: `eip155:${chainId}`,
            // @ts-expect-error -- snap_experimentalProviderRequest are not defined in SnapMethods
            request,
          },
        });

        return result;
      },
    };
  }

  /**
   * Gets the snaps provider.
   * @returns The snaps provider instance.
   */
  protected get snapsProvider(): SnapsProvider {
    return this.#snapsProvider;
  }

  /**
   * Gets the account address. Must be implemented by derived classes.
   *
   * @param options - The base account options including chainId.
   * @returns A promise resolving to the account address.
   */
  protected abstract getAccountAddress(
    options: AccountOptionsBase,
  ): Promise<Address>;

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
    console.log('getTokenMetadataClientForChainId', config);
    if (this.#accountApiClient.isChainIdSupported(config)) {
      console.log('Returning account api client', config);
      return this.#accountApiClient;
    }
    console.log('Returning tokenMetadataClient');

    return this.#tokenMetadataClient;
  }

  /**
   * Retrieves the token balance and metadata for the account.
   *
   * @param options - The options for fetching the token balance and metadata.
   * @returns A promise resolving to the token balance and metadata.
   */
  public async getTokenBalanceAndMetadata(
    options: GetTokenBalanceAndMetadataOptions,
  ): Promise<TokenBalanceAndMetadata> {
    logger.debug('accountController:getTokenBalanceAndMetadata()');

    const { chainId, assetAddress } = options;

    this.assertIsSupportedChainId(chainId);

    const account = await this.getAccountAddress({ chainId });

    const client = this.#getTokenMetadataClientForChainId({ chainId });

    const balanceAndMetadata = await client.getTokenBalanceAndMetadata({
      chainId,
      account,
      assetAddress,
    });

    logger.debug(
      'accountController:getTokenBalanceAndMetadata() - balance and metadata resolved',
    );

    return balanceAndMetadata;
  }
}
