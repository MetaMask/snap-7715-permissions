import { logger } from '@metamask/7715-permissions-shared/utils';
import { decodeSingle } from '@metamask/abi-utils';
import type { Hex } from '@metamask/delegation-core';
import {
  ChainDisconnectedError,
  InvalidInputError,
  InternalError,
  ResourceUnavailableError,
  type SnapsEthereumProvider,
} from '@metamask/snaps-sdk';
import { hexToNumber, numberToHex } from '@metamask/utils';

import type { RetryOptions } from './types';
import { getChainMetadata } from '../core/chainMetadata';
import { sleep } from '../utils/retry';

/**
 * Client that fetches nonce from nonce caveat enforcer.
 */
export class NonceCaveatClient {
  readonly #ethereumProvider: SnapsEthereumProvider;

  // keccak256('currentNonce()')
  static readonly #currentNonceCalldata = '0x2bd4ed21';

  constructor({
    ethereumProvider,
  }: {
    ethereumProvider: SnapsEthereumProvider;
  }) {
    this.#ethereumProvider = ethereumProvider;
  }

  /**
   * Fetch the nonce for a given account. If the request fails, it will retry
   * according to the retryOptions configuration.
   * @param args - The parameters for fetching the nonce.
   * @param args.chainId - The chain ID to fetch the nonce from.
   * @param args.account - The account address to fetch the nonce for.
   * @param args.retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
   * @returns The nonce.
   */
  public async getNonce({
    chainId,
    account,
    retryOptions,
  }: {
    chainId: number;
    account: Hex;
    retryOptions?: RetryOptions;
  }): Promise<bigint> {
    logger.debug('NonceCaveatClient:getNonce()');

    if (!chainId) {
      const message = 'No chainId provided to fetch nonce';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    const { contracts } = getChainMetadata({ chainId });

    if (!account) {
      const message = 'No account address provided to fetch nonce';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    const { retries = 1, delayMs = 1000 } = retryOptions ?? {};

    // Try up to initial attempt + retry attempts
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Check if we're on the correct chain and switch if not
        const selectedChain = await this.#ethereumProvider.request<Hex>({
          method: 'eth_chainId',
          params: [],
        });

        if (selectedChain && hexToNumber(selectedChain) !== chainId) {
          await this.#ethereumProvider.request<Hex>({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: numberToHex(chainId) }],
          });

          const updatedChain = await this.#ethereumProvider.request<Hex>({
            method: 'eth_chainId',
            params: [],
          });

          if (updatedChain && hexToNumber(updatedChain) !== chainId) {
            throw new ChainDisconnectedError(
              'Selected chain does not match the requested chain',
            );
          }
        }

        const nonceEncoded = await this.#ethereumProvider.request<Hex>({
          method: 'eth_call',
          params: [
            {
              to: contracts.enforcers.NonceEnforcer,
              data:
                NonceCaveatClient.#currentNonceCalldata +
                contracts.delegationManager.slice(2).padStart(64, '0') +
                account.slice(2).padStart(64, '0'),
            },
            'latest',
          ],
        });

        if (!nonceEncoded) {
          logger.error('Failed to fetch nonce');
          if (attempt < retries) {
            await sleep(delayMs);
            continue;
          }
          throw new ResourceUnavailableError('Failed to fetch nonce');
        }

        const nonce = decodeSingle('uint256', nonceEncoded);
        return nonce;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          `Failed to fetch nonce (attempt ${attempt + 1}): ${errorMessage}`,
        );

        // Check if this is a retryable error
        if (this.#isRetryableError(error)) {
          if (attempt < retries) {
            await sleep(delayMs);
            continue;
          }
          throw new ResourceUnavailableError('Failed to fetch nonce');
        } else {
          // Re-throw non-retryable errors immediately
          throw error;
        }
      }
    }

    throw new InternalError(
      `Failed to fetch nonce after ${retries + 1} attempts`,
    );
  }

  /**
   * Determines if an error is retryable.
   * @param error - The error to check.
   * @returns True if the error is retryable.
   */
  #isRetryableError(error: unknown): boolean {
    // Don't retry chain disconnection errors
    if (error instanceof ChainDisconnectedError) {
      return false;
    }

    // Retry other errors (network issues, temporary failures, etc.)
    return true;
  }
}
