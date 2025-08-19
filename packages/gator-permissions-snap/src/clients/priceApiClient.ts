import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  InvalidInputError,
  ResourceNotFoundError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';

import type { SpotPricesRes, VsCurrencyParam } from './types';

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
   * Fetch the spot prices for the given token CAIP-19 asset type.
   * @param caipAssetType - The token CAIP-19 asset type to fetch spot prices for. Defaults to ethereum.
   * @param vsCurrency - The currency to fetch the spot prices in. Defaults to USD.
   * @returns The spot prices for the given token CAIP-19 asset type.
   */
  public async getSpotPrice(
    caipAssetType: CaipAssetType,
    vsCurrency: VsCurrencyParam = 'usd',
  ): Promise<number> {
    // TODO: This endpoint take an array of CAIP-19 Compliant Asset IDs (comma-separated) but we are only passing one for now.
    // We can update this to take an array of CAIP-19 Compliant Asset IDs in the future.

    if (!caipAssetType) {
      logger.error(`No caipAssetType provided to fetch spot price`);
      throw new InvalidInputError(
        `No caipAssetType provided to fetch spot price`,
      );
    }

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
      } else if (response.status >= 500) {
        throw new ResourceUnavailableError(
          `Price service temporarily unavailable (HTTP ${response.status})`,
        );
      } else {
        throw new ResourceUnavailableError(
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
}
