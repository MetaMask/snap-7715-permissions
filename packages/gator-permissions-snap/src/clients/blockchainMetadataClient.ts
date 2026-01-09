import { ZERO_ADDRESS } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import { decodeSingle } from '@metamask/abi-utils';
import type { Hex } from '@metamask/delegation-core';
import {
  ChainDisconnectedError,
  InvalidInputError,
  InternalError,
  ResourceNotFoundError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';
import type { SnapsEthereumProvider } from '@metamask/snaps-sdk';

import type {
  RetryOptions,
  TokenBalanceAndMetadata,
  TokenMetadataClient,
} from './types';
import { callContract, ensureChain } from '../utils/blockchain';
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

  // keccak256('disabledDelegations(bytes32)')
  static readonly #disabledDelegationsCalldata = '0x2d40d052';

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
        // If no asset address is provided, fetch native token balance
        if (
          !assetAddress ||
          assetAddress === BlockchainTokenMetadataClient.#nativeTokenAddress
        ) {
          // For native token, ensure chain and use eth_getBalance
          await ensureChain(this.#ethereumProvider, chainId);

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

        // Ensure we're on the correct chain once before making multiple calls
        await ensureChain(this.#ethereumProvider, chainId);

        const balanceCallData = `${
          BlockchainTokenMetadataClient.#balanceOfCalldata
        }${account.slice(2).padStart(64, '0')}` as Hex;

        const [balanceEncoded, decimalsEncoded, symbolEncoded] =
          await Promise.all([
            callContract({
              ethereumProvider: this.#ethereumProvider,
              contractAddress: assetAddress,
              callData: balanceCallData,
              retryOptions,
            }),
            callContract({
              ethereumProvider: this.#ethereumProvider,
              contractAddress: assetAddress,
              callData: BlockchainTokenMetadataClient.#decimalsCalldata as Hex,
              retryOptions,
            }),
            callContract({
              ethereumProvider: this.#ethereumProvider,
              contractAddress: assetAddress,
              callData: BlockchainTokenMetadataClient.#symbolCalldata as Hex,
              retryOptions,
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

  /**
   * Checks if a delegation is disabled on-chain by calling the DelegationManager contract.
   * If the request fails, it will retry according to the retryOptions configuration.
   * @param args - The parameters for checking delegation disabled status.
   * @param args.delegationHash - The hash of the delegation to check.
   * @param args.chainId - The chain ID in hex format.
   * @param args.delegationManagerAddress - The address of the DelegationManager contract.
   * @param args.retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
   * @returns True if the delegation is disabled, false if it is confirmed to be enabled.
   * @throws InvalidInputError if input parameters are invalid.
   * @throws ChainDisconnectedError if the provider is on the wrong chain.
   * @throws ResourceUnavailableError if the on-chain check fails and we cannot determine the status.
   */
  public async checkDelegationDisabledOnChain({
    delegationHash,
    chainId,
    delegationManagerAddress,
    retryOptions,
  }: {
    delegationHash: Hex;
    chainId: Hex;
    delegationManagerAddress: Hex;
    retryOptions?: RetryOptions;
  }): Promise<boolean> {
    logger.debug(
      'BlockchainTokenMetadataClient:checkDelegationDisabledOnChain()',
      {
        delegationHash,
        chainId,
        delegationManagerAddress,
      },
    );

    if (!delegationHash) {
      const message = 'No delegation hash provided';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    if (!chainId) {
      const message = 'No chain ID provided';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    if (!delegationManagerAddress) {
      const message = 'No delegation manager address provided';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    // Ensure we're on the correct chain
    // This can throw ChainDisconnectedError - we want it to propagate
    await ensureChain(this.#ethereumProvider, chainId);

    // Encode the function call data for disabledDelegations(bytes32)
    const encodedParams = delegationHash.slice(2).padStart(64, '0'); // Remove 0x and pad to 32 bytes
    const callData =
      `${BlockchainTokenMetadataClient.#disabledDelegationsCalldata}${encodedParams}` as Hex;

    try {
      const result = await callContract({
        ethereumProvider: this.#ethereumProvider,
        contractAddress: delegationManagerAddress,
        callData,
        retryOptions,
        isRetryableError: (error) => this.#isRetryableError(error),
      });

      // Parse the boolean result (32 bytes, last byte is the boolean value)
      const isDisabled =
        result !==
        '0x0000000000000000000000000000000000000000000000000000000000000000';

      logger.debug('Delegation disabled status result', { isDisabled });
      return isDisabled;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Failed to check delegation disabled status: ${errorMessage}`,
      );

      // Re-throw critical errors - they should propagate
      if (
        error instanceof InvalidInputError ||
        error instanceof ChainDisconnectedError
      ) {
        throw error;
      }

      // For other errors (network issues, contract call failures, etc.),
      // we cannot determine the status, so throw an error instead of returning false
      throw new ResourceUnavailableError(
        `Unable to determine delegation disabled status: ${errorMessage}`,
      );
    }
  }
}
