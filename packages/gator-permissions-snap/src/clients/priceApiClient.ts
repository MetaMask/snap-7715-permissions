import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  InternalError,
  InvalidInputError,
  ResourceNotFoundError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';

import type { RetryOptions, SpotPricesRes, VsCurrencyParam } from './types';
import { isResourceUnavailableStatus, sleep } from '../utils/retry';

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
      const response = await this.#fetchSpotPrice(caipAssetType, vsCurrency);
      // Process the response
      if (!response.ok) {
        logger.error(
          `HTTP error! Failed to fetch spot price for caipAssetType(${caipAssetType}) and vsCurrency(${vsCurrency}): ${response.status}`,
        );

        // Check if this is a retryable error
        if (isResourceUnavailableStatus(response.status) && attempt < retries) {
          await sleep(delayMs);
          continue;
        }

        // Throw appropriate error based on status code
        if (response.status === 404) {
          throw new ResourceNotFoundError(
            `Spot price not found for ${caipAssetType}`,
          );
        } else if (isResourceUnavailableStatus(response.status)) {
          throw new ResourceUnavailableError(
            `Price service temporarily unavailable (HTTP ${response.status})`,
          );
        } else {
          throw new InvalidInputError(
            `HTTP error ${response.status}: Failed to fetch spot price for ${caipAssetType}`,
          );
        }
      }

      // Parse and validate the response
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

    throw new InternalError(
      `Failed to fetch spot price after ${retries + 1} attempts`,
    );
  }

  /**
   * Internal method to fetch spot price and return the raw response.
   * @param caipAssetType - The token CAIP-19 asset type to fetch spot prices for.
   * @param vsCurrency - The currency to fetch the spot prices in.
   * @returns The raw fetch response.
   */
  async #fetchSpotPrice(
    caipAssetType: CaipAssetType,
    vsCurrency: VsCurrencyParam,
  ): Promise<globalThis.Response> {
    try {
      return this.#fetch(
        `${
          this.#baseUrl
        }/v3/spot-prices?includeMarketData=false&vsCurrency=${vsCurrency}&assetIds=${caipAssetType}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Error fetching spot price: ${errorMessage}`);
      throw new InternalError(`Error fetching spot price: ${errorMessage}`);
    }
  }
}
