import { logger } from '@metamask/7715-permissions-shared/utils';
import type { SnapsProvider } from '@metamask/snaps-sdk';

import { getChainMetadata } from '../core/chainMetadata';

/**
 * Base class for account controllers that provides common functionality.
 */
export abstract class BaseAccountController {
  readonly #snapsProvider: SnapsProvider;

  protected supportedChains: readonly number[];

  /**
   * Initializes a new BaseAccountController instance.
   *
   * @param config - The configuration object.
   * @param config.snapsProvider - The provider for interacting with snaps.
   * @param config.supportedChains - The supported blockchain chains.
   */
  constructor(config: {
    snapsProvider: SnapsProvider;
    supportedChains: readonly number[];
  }) {
    this.#validateSupportedChains(config.supportedChains);

    this.#snapsProvider = config.snapsProvider;
    this.supportedChains = config.supportedChains;
  }

  /**
   * Validates that the specified chains are supported.
   *
   * @param supportedChains - The chains to validate.
   * @throws If no chains are specified or if any chain is not supported.
   */
  #validateSupportedChains(supportedChains: readonly number[]) {
    if (supportedChains.length === 0) {
      logger.error('No supported chains specified');
      throw new Error('No supported chains specified');
    }

    // ensure that there is chain metadata for all specified chains
    try {
      supportedChains.map((chainId) => getChainMetadata({ chainId }));
    } catch (error) {
      logger.error('Unsupported chains specified', {
        supportedChains,
        error,
      });
      throw new Error(
        `Unsupported chains specified: ${supportedChains.join(', ')}`,
      );
    }
  }

  /**
   * Asserts that the specified chain ID is supported.
   *
   * @param chainId - The chain ID to validate.
   * @throws If the chain ID is not supported.
   */
  protected assertIsSupportedChainId(chainId: number) {
    if (!this.supportedChains.includes(chainId)) {
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
  protected createExperimentalProviderRequestProvider(chainId: number) {
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
}
