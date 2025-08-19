import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  InvalidInputError,
  ResourceNotFoundError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';

import type { SpotPricesRes, VsCurrencyParam } from './types';

/**
 * Options for configuring retry behavior.
 */
export type RetryOptions = {
  /** Number of retry attempts. Defaults to 1. */
  attempts?: number;
  /** Delay between retries in milliseconds. Defaults to 1000. */
  delayMs?: number;
};

/**
 * Class responsible for fetching price data from the Price API.
 */
export class PriceApiClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #baseUrl: string;

  constructor(
    baseUrl: string,
    fetch: typeof globalThis.fetch = globalThis.fetch,
  ) {
    this.#fetch = fetch;
    this.#baseUrl = baseUrl.replace(/\/+$/u, ''); // Remove trailing slashes
  }

  /**
   * Fetch the spot prices for the given token CAIP-19 asset type. If the request fails, it will retry once
   * with a 1 second delay if not otherwise specified in the retryOptions.
   * @param caipAssetType - The token CAIP-19 asset type to fetch spot prices for. Defaults to ethereum.
   * @param vsCurrency - The currency to fetch the spot prices in. Defaults to USD.
   * @param retryOptions - Optional retry configuration. Defaults to 1 attempt with 1000ms delay.
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

    const { attempts = 1, delayMs = 1000 } = retryOptions ?? {};
    let lastError: Error = new Error('No attempts made');

    // Try up to initial attempt + retry attempts
    for (let attempt = 0; attempt <= attempts; attempt++) {
      try {
        return await this.#fetchSpotPrice(caipAssetType, vsCurrency);
      } catch (error) {
        lastError = error as Error;

        // Only retry on ResourceUnavailableError (5xx status codes)
        if (error instanceof ResourceUnavailableError && attempt < attempts) {
          // Wait specified delay before retry
          await this.#sleep(delayMs);
          continue;
        }

        // Don't retry or max retries reached
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Internal method to fetch spot price with error handling.
   * @param caipAssetType - The token CAIP-19 asset type to fetch spot prices for.
   * @param vsCurrency - The currency to fetch the spot prices in.
   * @returns The spot prices for the given token CAIP-19 asset type.
   */
  async #fetchSpotPrice(
    caipAssetType: CaipAssetType,
    vsCurrency: VsCurrencyParam,
  ): Promise<number> {
    const response = await this.#fetch(
      `${
        this.#baseUrl
      }/v3/spot-prices?includeMarketData=false&vsCurrency=${vsCurrency}&assetIds=${caipAssetType}`,
    );

    if (!response.ok) {
      logger.error(
        `HTTP error! Failed to fetch spot price for caipAssetType(${caipAssetType}) and vsCurrency(${vsCurrency}): ${response.status}`,
      );

      if (response.status === 404) {
        throw new ResourceNotFoundError(
          `Spot price not found for ${caipAssetType}`,
        );
      } else if (
        response.status >= 500 ||
        response.status === 429 ||
        response.status === 408
      ) {
        throw new ResourceUnavailableError(
          `Price service temporarily unavailable (HTTP ${response.status})`,
        );
      } else {
        throw new InvalidInputError(
          `HTTP error ${response.status}: Failed to fetch spot price for ${caipAssetType}`,
        );
      }
    }

    const spotPricesRes = (await response.json()) as SpotPricesRes;

    const assetTypeData = spotPricesRes[caipAssetType];
    if (!assetTypeData) {
      logger.error(
        `No spot price found in result for the token CAIP-19 asset type: ${caipAssetType}`,
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
