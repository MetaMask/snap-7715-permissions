import { logger } from '@metamask/7715-permissions-shared/utils';
import { decodeSingle } from '@metamask/abi-utils';
import type { Hex } from '@metamask/delegation-core';
import {
  ChainDisconnectedError,
  InvalidInputError,
  InternalError,
  ResourceNotFoundError,
  type SnapsEthereumProvider,
} from '@metamask/snaps-sdk';
import { hexToNumber, numberToHex } from '@metamask/utils';

import { ZERO_ADDRESS } from '../constants';
import type {
  RetryOptions,
  TokenBalanceAndMetadata,
  TokenMetadataClient,
} from './types';
import { sleep } from '../utils/httpClient';

/**
 * Client that fetches token metadata directly from the blockchain using the ethereum provider
 */
export class BlockchainTokenMetadataClient implements TokenMetadataClient {
  readonly #ethereumProvider: SnapsEthereumProvider;

  static readonly #nativeTokenAddress = ZERO_ADDRESS;

  static readonly #nativeTokenDecimals = 18;

  static readonly #nativeTokenSymbol = 'ETH';

  // keccak256('balanceOf(address)')
  static readonly #balanceOfCalldata = '0x70a08231';

  // keccak256('decimals()')
  static readonly #decimalsCalldata = '0x313ce567';

  // keccak256('symbol()')
  static readonly #symbolCalldata = '0x95d89b41';

  constructor({
    ethereumProvider,
  }: {
    ethereumProvider: SnapsEthereumProvider;
  }) {
    this.#ethereumProvider = ethereumProvider;
  }

  /**
   * Fetch the token balance and metadata for a given account and token. If the request fails, it will retry
   * according to the retryOptions configuration.
   * @param args - The parameters for fetching the token balance.
   * @param args.chainId - The chain ID to fetch the balance from.
   * @param args.assetAddress - The token address to fetch the balance for. If not provided, fetches native token balance.
   * @param args.account - The account address to fetch the balance for.
   * @param args.retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
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
    logger.debug('BlockchainTokenMetadataClient:getTokenBalanceAndMetadata()');

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

    // Try up to initial attempt + retry attempts
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Check if we're on the correct chain
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

        // If no asset address is provided, fetch native token balance
        if (
          !assetAddress ||
          assetAddress === BlockchainTokenMetadataClient.#nativeTokenAddress
        ) {
          const balance = await this.#ethereumProvider.request<Hex>({
            method: 'eth_getBalance',
            params: [account, 'latest'],
          });

          if (balance === undefined || balance === null) {
            throw new ResourceNotFoundError(
              'Failed to fetch native token balance',
            );
          }

          const { symbol, decimals } = {
            symbol: BlockchainTokenMetadataClient.#nativeTokenSymbol,
            decimals: BlockchainTokenMetadataClient.#nativeTokenDecimals,
          };

          return {
            balance: BigInt(balance),
            decimals,
            symbol,
          };
        }

        const [balanceEncoded, decimalsEncoded, symbolEncoded] =
          await Promise.all([
            this.#ethereumProvider.request<Hex>({
              method: 'eth_call',
              params: [
                {
                  to: assetAddress,
                  data:
                    BlockchainTokenMetadataClient.#balanceOfCalldata +
                    account.slice(2).padStart(64, '0'),
                },
                'latest',
              ],
            }),
            this.#ethereumProvider.request<Hex>({
              method: 'eth_call',
              params: [
                {
                  to: assetAddress,
                  data: BlockchainTokenMetadataClient.#decimalsCalldata,
                },
                'latest',
              ],
            }),
            this.#ethereumProvider.request<Hex>({
              method: 'eth_call',
              params: [
                {
                  to: assetAddress,
                  data: BlockchainTokenMetadataClient.#symbolCalldata,
                },
                'latest',
              ],
            }),
          ]);

        if (!symbolEncoded) {
          throw new ResourceNotFoundError('Failed to fetch token symbol');
        }

        if (!decimalsEncoded) {
          throw new ResourceNotFoundError('Failed to fetch token decimals');
        }

        if (!balanceEncoded) {
          throw new ResourceNotFoundError('Failed to fetch token balance');
        }

        if (
          symbolEncoded === '0x' &&
          decimalsEncoded === '0x' &&
          balanceEncoded === '0x'
        ) {
          logger.error('Token address is invalid');
          throw new InvalidInputError(
            'Failed to fetch token balance and metadata: Token address is invalid',
          );
        }

        const symbol = decodeSingle('string', symbolEncoded);
        const decimals = decodeSingle('uint8', decimalsEncoded);
        const balance = decodeSingle('uint256', balanceEncoded);

        return {
          balance,
          decimals: Number(decimals),
          symbol,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          `Failed to fetch token balance and metadata (attempt ${attempt + 1}): ${errorMessage}`,
        );

        // Check if this is a retryable error
        if (this.#isRetryableError(error)) {
          if (attempt < retries) {
            await sleep(delayMs);
            continue;
          }
          throw new ResourceNotFoundError(
            'Failed to fetch token balance and metadata',
          );
        } else {
          // Re-throw non-retryable errors immediately
          throw error;
        }
      }
    }

    throw new InternalError(
      `Failed to fetch token balance and metadata after ${retries + 1} attempts`,
    );
  }

  /**
   * Determines if an error is retryable.
   * @param error - The error to check.
   * @returns True if the error is retryable.
   */
  #isRetryableError(error: unknown): boolean {
    // Don't retry chain disconnection errors or invalid input errors
    if (
      error instanceof ChainDisconnectedError ||
      error instanceof InvalidInputError
    ) {
      return false;
    }

    // Retry other errors (network issues, temporary failures, etc.)
    return true;
  }
}
