import { zAddress } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import { type Hex } from '@metamask/delegation-core';
import { InvalidInputError, ResourceNotFoundError } from '@metamask/snaps-sdk';
import { z } from 'zod';

import { ZERO_ADDRESS } from '../constants';
import type { TokenBalanceAndMetadata } from './types';
import { makeValidatedRequest } from '../utils/httpClient';

/**
 * Zod schema for validating token balance response
 */
const TokenBalanceResponseSchema = z.object({
  name: z.string().min(1).max(100),
  symbol: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9]+$/iu, 'Symbol must contain only alphanumeric characters'),
  decimals: z.number().int().min(0).max(77), // ERC-20 standard allows up to 77 decimals
  type: z.string().min(1).max(20).optional(),
  iconUrl: z.string().url().max(2048).optional(), // Limit URL length and validate format
  coingeckoId: z.string().min(1).max(100),
  address: zAddress,
  occurrences: z.number().nonnegative(),
  sources: z.array(z.string().min(1).max(100)).max(50), // Limit number of sources
  chainId: z.number().int().positive(),
  blockNumber: z
    .string()
    .regex(
      /^(latest|\d+)$/u,
      'Block number must be "latest" or numeric string',
    ),
  updatedAt: z.string().datetime(),
  value: z.record(z.unknown()),
  price: z.number().finite().min(0),
  accounts: z
    .array(
      z.object({
        accountAddress: zAddress,
        chainId: z.number().int().positive(),
        rawBalance: z
          .string()
          .regex(/^\d+$/u, 'Raw balance must be numeric string'),
        balance: z.number().finite().min(0),
      }),
    )
    .min(1)
    .max(1000), // Ensure accounts is an array with reasonable limits
});

/**
 * Configuration options for AccountApiClient
 */
export type AccountApiClientConfig = {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs: number;
  maxResponseSizeBytes: number;
};

/**
 * Class responsible for fetching account data from the Account API.
 */
export class AccountApiClient {
  static readonly #supportedTokenTypes = ['native', 'erc20'];

  static readonly #nativeTokenAddress = ZERO_ADDRESS;

  readonly #fetch: typeof globalThis.fetch;

  readonly #baseUrl: string;

  readonly #timeoutMs: number;

  readonly #maxResponseSizeBytes: number;

  constructor({
    baseUrl,
    fetch = globalThis.fetch,
    timeoutMs,
    maxResponseSizeBytes,
  }: AccountApiClientConfig) {
    this.#fetch = fetch;
    this.#baseUrl = baseUrl.replace(/\/+$/u, ''); // Remove trailing slashes
    this.#timeoutMs = timeoutMs;
    this.#maxResponseSizeBytes = maxResponseSizeBytes;
  }

  /**
   * Checks if a chain ID is supported by the account API.
   * Currently only mainnet (chain ID 1) is supported.
   *
   * @param params - The parameters object.
   * @param params.chainId - The chain ID to check.
   * @returns True if the chain ID is supported, false otherwise.
   */
  public isChainIdSupported({ chainId }: { chainId: number }): boolean {
    return chainId === 1;
  }

  /**
   * Fetch the token balance and metadata for a given account and token.
   *
   * @param params - The parameters for fetching the token balance.
   * @param params.chainId - The chain ID to fetch the balance from.
   * @param params.assetAddress - The token address to fetch the balance for. If not provided, fetches native token balance.
   * @param params.account - The account address to fetch the balance for.
   * @returns The token balance and metadata.
   */
  public async getTokenBalanceAndMetadata({
    chainId,
    assetAddress,
    account,
  }: {
    chainId: number;
    account: Hex;
    assetAddress?: Hex | undefined;
  }): Promise<TokenBalanceAndMetadata> {
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

    const tokenAddress = assetAddress ?? AccountApiClient.#nativeTokenAddress;

    const validatedResponse = await makeValidatedRequest(
      `${this.#baseUrl}/tokens/${tokenAddress}?accountAddresses=${account}&chainId=${chainId}`,
      {
        timeoutMs: this.#timeoutMs,
        maxResponseSizeBytes: this.#maxResponseSizeBytes,
        fetch: this.#fetch,
      },
      TokenBalanceResponseSchema,
    );

    const { accounts, type, iconUrl, symbol, decimals } = validatedResponse;

    const accountLowercase = account.toLowerCase();
    const accountData = accounts.find(
      (acc) => acc.accountAddress.toLowerCase() === accountLowercase,
    );

    if (!accountData) {
      const message = `No balance data found for the account: ${account}`;
      logger.error(message);

      throw new ResourceNotFoundError(message);
    }

    if (
      type !== undefined &&
      !AccountApiClient.#supportedTokenTypes.includes(type)
    ) {
      const message = `Unsupported token type: ${type}`;
      logger.error(message);

      throw new InvalidInputError(message);
    }

    // Additional validation for balance conversion
    let balance: bigint;
    try {
      balance = BigInt(accountData.rawBalance);
    } catch (error) {
      const message = `Invalid balance format: ${accountData.rawBalance}`;
      logger.error(message, error);
      throw new InvalidInputError(message);
    }

    // Sanitize iconUrl if present
    const sanitizedIconUrl = iconUrl
      ? this.#sanitizeIconUrl(iconUrl)
      : undefined;

    const result: TokenBalanceAndMetadata = {
      balance,
      decimals,
      symbol,
    };

    if (sanitizedIconUrl) {
      result.iconUrl = sanitizedIconUrl;
    }

    return result;
  }

  /**
   * Sanitizes an icon URL to prevent potential security issues.
   * @param iconUrl - The icon URL to sanitize.
   * @returns The sanitized icon URL or undefined if invalid.
   */
  #sanitizeIconUrl(iconUrl: string): string | undefined {
    try {
      const url = new URL(iconUrl);

      // Only allow HTTPS URLs
      if (url.protocol !== 'https:') {
        logger.warn(`Rejecting non-HTTPS icon URL: ${iconUrl}`);
        return undefined;
      }

      // Only allow common image formats
      const allowedExtensions = [
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.svg',
        '.webp',
      ];
      const hasValidExtension = allowedExtensions.some((ext) =>
        url.pathname.toLowerCase().endsWith(ext),
      );

      if (!hasValidExtension) {
        logger.warn(`Rejecting icon URL with invalid extension: ${iconUrl}`);
        return undefined;
      }

      return url.toString();
    } catch (error) {
      logger.warn(`Invalid icon URL format: ${iconUrl}`, error);
      return undefined;
    }
  }
}
