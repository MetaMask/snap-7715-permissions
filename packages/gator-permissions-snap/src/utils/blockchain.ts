import type { Hex } from '@metamask/delegation-core';
import {
  ChainDisconnectedError,
  InternalError,
  ResourceNotFoundError,
} from '@metamask/snaps-sdk';
import type { SnapsEthereumProvider } from '@metamask/snaps-sdk';
import { hexToNumber, numberToHex } from '@metamask/utils';

import { sleep } from './httpClient';
import { validateTransactionReceipt } from './validate';
import type { RetryOptions, TransactionReceipt } from '../clients/types';

/**
 * Ensures the ethereum provider is connected to the specified chain.
 * If the provider is on a different chain, it will attempt to switch to the requested chain.
 *
 * @param ethereumProvider - The ethereum provider to check and potentially switch chains on.
 * @param chainId - The desired chain ID. Can be either a number or a hex string.
 * @throws ChainDisconnectedError if the chain switch fails or the provider remains on a different chain.
 */
export async function ensureChain(
  ethereumProvider: SnapsEthereumProvider,
  chainId: number | Hex,
): Promise<void> {
  const numericChainId =
    typeof chainId === 'number' ? chainId : hexToNumber(chainId);
  const chainIdHex =
    typeof chainId === 'number' ? numberToHex(chainId) : chainId;

  const selectedChain = await ethereumProvider.request<Hex>({
    method: 'eth_chainId',
    params: [],
  });

  if (selectedChain && hexToNumber(selectedChain) !== numericChainId) {
    await ethereumProvider.request<Hex>({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });

    const updatedChain = await ethereumProvider.request<Hex>({
      method: 'eth_chainId',
      params: [],
    });

    if (updatedChain && hexToNumber(updatedChain) !== numericChainId) {
      throw new ChainDisconnectedError(
        'Selected chain does not match the requested chain',
      );
    }
  }
}

/**
 * Makes a contract call to the blockchain with retry logic.
 * Note: The caller is responsible for ensuring the provider is on the correct chain using `ensureChain`.
 *
 * @param args - The parameters for the contract call.
 * @param args.ethereumProvider - The ethereum provider to use for the call.
 * @param args.contractAddress - The address of the contract to call.
 * @param args.callData - The encoded function call data (function selector + parameters).
 * @param args.retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
 * @param args.isRetryableError - Optional function to determine if an error is retryable. Defaults to retrying all errors except ChainDisconnectedError.
 * @returns The hex-encoded result of the contract call.
 * @throws ResourceNotFoundError if the call fails after all retries.
 * @throws The original error if it's not retryable.
 */
export async function callContract({
  ethereumProvider,
  contractAddress,
  callData,
  retryOptions,
  isRetryableError,
}: {
  ethereumProvider: SnapsEthereumProvider;
  contractAddress: Hex;
  callData: Hex;
  retryOptions?: RetryOptions | undefined;
  isRetryableError?: ((error: unknown) => boolean) | undefined;
}): Promise<Hex> {
  const { retries = 1, delayMs = 1000 } = retryOptions ?? {};
  const defaultIsRetryableError = (error: unknown): boolean => {
    return !(error instanceof ChainDisconnectedError);
  };
  const shouldRetry = isRetryableError ?? defaultIsRetryableError;

  // Try up to initial attempt + retry attempts
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await ethereumProvider.request<Hex>({
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            data: callData,
          },
          'latest',
        ],
      });

      if (!result) {
        throw new ResourceNotFoundError('Contract call returned no result');
      }

      return result;
    } catch (error) {
      // Check if this is a retryable error
      if (shouldRetry(error)) {
        if (attempt < retries) {
          await sleep(delayMs);
          continue;
        }
        throw new ResourceNotFoundError('Contract call failed after retries');
      }
      // Re-throw non-retryable errors immediately
      throw error;
    }
  }

  throw new InternalError(`Contract call failed after ${retries + 1} attempts`);
}

/**
 * Gets a transaction receipt from the blockchain with retry logic.
 * Note: The caller is responsible for ensuring the provider is on the correct chain using `ensureChain`.
 *
 * @param args - The parameters for the transaction receipt.
 * @param args.ethereumProvider - The ethereum provider to use for the call.
 * @param args.txHash - The hash of the transaction to get the receipt for.
 * @param args.retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
 * @param args.isRetryableError - Optional function to determine if an error is retryable. Defaults to retrying all errors except ChainDisconnectedError.
 * @returns The transaction receipt.
 * @throws ResourceNotFoundError if the transaction receipt is not found after all retries.
 * @throws The original error if it's not retryable.
 */
export async function getTransactionReceipt({
  ethereumProvider,
  txHash,
  retryOptions,
  isRetryableError,
}: {
  ethereumProvider: SnapsEthereumProvider;
  txHash: Hex;
  retryOptions?: RetryOptions | undefined;
  isRetryableError?: ((error: unknown) => boolean) | undefined;
}): Promise<TransactionReceipt> {
  const { retries = 1, delayMs = 1000 } = retryOptions ?? {};
  const defaultIsRetryableError = (error: unknown): boolean => {
    return !(error instanceof ChainDisconnectedError);
  };
  const shouldRetry = isRetryableError ?? defaultIsRetryableError;

  // Try up to initial attempt + retry attempts
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await ethereumProvider.request<TransactionReceipt>({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      });

      if (!result) {
        throw new ResourceNotFoundError('Transaction receipt not found');
      }

      return validateTransactionReceipt(result);
    } catch (error) {
      // Check if this is a retryable error
      if (shouldRetry(error)) {
        if (attempt < retries) {
          await sleep(delayMs);
          continue;
        }
        throw new ResourceNotFoundError(
          'Transaction receipt not found after retries',
        );
      }
      // Re-throw non-retryable errors immediately
      throw error;
    }
  }

  throw new InternalError(
    `Transaction receipt not found after ${retries + 1} attempts`,
  );
}
