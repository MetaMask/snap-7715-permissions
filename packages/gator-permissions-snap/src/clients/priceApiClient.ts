import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  InternalError,
  InvalidInputError,
  ResourceNotFoundError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';
import { z } from 'zod';

import type { SpotPricesRes, VsCurrencyParam } from './types';
import { makeRequestWithLimits } from '../utils/httpClient';

/**
 * Zod schema for validating spot prices response
 */
const SpotPricesResponseSchema = z.record(
  z.string().min(1).max(200), // CAIP asset type validation
  z.record(
    z.string().min(1).max(10), // Currency code validation
    z.number().finite().min(0).max(1e12), // Price validation (0 to 1 trillion)
  ),
);

/**
 * Options for configuring retry behavior.
 */
export type RetryOptions = {
  /** Number of retry attempts. */
  retries?: number;
  /** Delay between retries in milliseconds. */
  delayMs?: number;
};

/**
 * Configuration options for PriceApiClient
 */
export type PriceApiClientConfig = {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs: number;
  maxResponseSizeBytes: number;
};

/**
 * Class responsible for fetching price data from the Price API.
 */
export class PriceApiClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #baseUrl: string;

  readonly #timeoutMs: number;

  readonly #maxResponseSizeBytes: number;

  constructor({
    baseUrl,
    fetch = globalThis.fetch,
    timeoutMs,
    maxResponseSizeBytes,
  }: PriceApiClientConfig) {
    this.#fetch = fetch;
    this.#baseUrl = baseUrl.replace(/\/+$/u, ''); // Remove trailing slashes
    this.#timeoutMs = timeoutMs;
    this.#maxResponseSizeBytes = maxResponseSizeBytes;
  }

  /**
   * Fetch the spot prices for the given token CAIP-19 asset type. If the request fails, it will retry
   * according to the retryOptions configuration.
   * @param caipAssetType - The token CAIP-19 asset type to fetch spot prices for.
   * @param vsCurrency - The currency to fetch the spot prices in. Defaults to USD.
   * @param retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
   * @returns The spot prices for the given token CAIP-19 asset type.
   */
  public async getSpotPrice(
    caipAssetType: CaipAssetType,
    vsCurrency: VsCurrencyParam = 'usd',
    retryOptions?: RetryOptions,
  ): Promise<number> {
    // TODO: This endpoint take an array of CAIP-19 Compliant Asset IDs (comma-separated) but we are only passing one for now.
    // We can update this to take an array of CAIP-19 Compliant Asset IDs in the future.

    if (!caipAssetType) {
      logger.error(`No caipAssetType provided to fetch spot price`);
      throw new InvalidInputError(
        `No caipAssetType provided to fetch spot price`,
      );
    }

    const { retries = 1, delayMs = 1000 } = retryOptions ?? {};

    // Try up to initial attempt + retry attempts
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const validatedResponse = await this.#fetchSpotPrice(
          caipAssetType,
          vsCurrency,
        );

        // Try exact match first, then case-insensitive lookup
        let assetTypeData = validatedResponse[caipAssetType];
        if (!assetTypeData) {
          // If exact match fails, try case-insensitive lookup
          const responseKeys = Object.keys(validatedResponse);
          const matchingKey = responseKeys.find(
            (key) => key.toLowerCase() === caipAssetType.toLowerCase(),
          );

          if (matchingKey) {
            assetTypeData = validatedResponse[matchingKey as CaipAssetType];
          }
        }

        if (!assetTypeData) {
          logger.error(
            `No spot price found in result for the token CAIP-19 asset type: ${caipAssetType}. Available keys: ${Object.keys(validatedResponse).join(', ')}`,
          );
          throw new ResourceNotFoundError(
            `No spot price found in result for the token CAIP-19 asset type: ${caipAssetType}`,
          );
        }

        const vsCurrencyData = assetTypeData[vsCurrency];
        if (!vsCurrencyData) {
          logger.error(
            `No spot price found in result for the currency: ${vsCurrency}`,
          );
          throw new ResourceNotFoundError(
            `No spot price found in result for the currency: ${vsCurrency}`,
          );
        }

        return vsCurrencyData;
      } catch (error) {
        // Check if this is a retryable error
        if (error instanceof ResourceUnavailableError && attempt < retries) {
          await this.#sleep(delayMs);
          continue;
        }

        // If it's not retryable or we've exhausted retries, re-throw
        throw error;
      }
    }

    throw new InternalError(
      `Failed to fetch spot price after ${retries + 1} attempts`,
    );
  }

  /**
   * Internal method to fetch spot price and return the validated response.
   * @param caipAssetType - The token CAIP-19 asset type to fetch spot prices for.
   * @param vsCurrency - The currency to fetch the spot prices in.
   * @returns The validated spot prices response.
   */
  async #fetchSpotPrice(
    caipAssetType: CaipAssetType,
    vsCurrency: VsCurrencyParam,
  ): Promise<SpotPricesRes> {
    return await makeRequestWithLimits(
      `${
        this.#baseUrl
      }/v3/spot-prices?includeMarketData=false&vsCurrency=${vsCurrency}&assetIds=${caipAssetType}`,
      {
        timeoutMs: this.#timeoutMs,
        maxResponseSizeBytes: this.#maxResponseSizeBytes,
        fetch: this.#fetch,
      },
      SpotPricesResponseSchema,
    );
  }

  /**
   * Utility method to sleep for a specified number of milliseconds.
   * @param ms - The number of milliseconds to sleep.
   * @returns A promise that resolves after the specified delay.
   */
  async #sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
