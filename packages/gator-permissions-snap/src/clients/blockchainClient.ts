import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/delegation-core';
import {
  ChainDisconnectedError,
  InvalidInputError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';
import type { SnapsEthereumProvider } from '@metamask/snaps-sdk';

import type { RetryOptions } from './types';
import {
  callContract,
  ensureChain,
  getTransactionReceipt,
} from '../utils/blockchain';

/**
 * Client that fetches blockchain data using the ethereum provider for on-chain checks.
 */
export class BlockchainClient {
  readonly #ethereumProvider: SnapsEthereumProvider;

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
      'BlockchainClient:checkDelegationDisabledOnChain()',
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
      `${BlockchainClient.#disabledDelegationsCalldata}${encodedParams}` as Hex;

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

  /**
   * Checks if a transaction was successful by calling the eth_getTransactionReceipt method.
   * @param args - The parameters for checking the transaction receipt.
   * @param args.txHash - The hash of the transaction to check.
   * @param args.chainId - The chain ID in hex format.
   * @returns True if the transaction receipt is valid, false if it is not.
   * @throws InvalidInputError if `chainId` is not specified
   * @throws ChainDisconnectedError if the provider is on the wrong chain.
   * @throws ResourceUnavailableError if the on-chain check fails and we cannot determine the status.
   */
  public async checkTransactionReceipt({
    txHash,
    chainId,
  }: {
    txHash: Hex;
    chainId: Hex;
  }): Promise<boolean> {
    logger.debug('BlockchainClient:checkTransactionReceipt()', {
      txHash,
      chainId,
    });

    if (!chainId) {
      const message = 'No chain ID provided';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    if (!txHash) {
      const message = 'No transaction hash provided';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    await ensureChain(this.#ethereumProvider, chainId);

    try {
      const result = await getTransactionReceipt({
        ethereumProvider: this.#ethereumProvider,
        txHash,
        isRetryableError: (error) => this.#isRetryableError(error),
      });

      return result.status === '0x1';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Failed to fetch transaction receipt: ${errorMessage}`);

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
        `Failed to fetch transaction receipt: ${errorMessage}`,
      );
    }
  }
}
