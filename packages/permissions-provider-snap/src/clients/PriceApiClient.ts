import { logger } from '@metamask/7715-permissions-shared/utils';
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
    this.#baseUrl = baseUrl;
  }

  /**
   * Fetch the spot prices for the given token CAIP-19 IDs.
   *
   * @param tokenCaip19Id - The token CAIP-19 ID to fetch spot prices for. Defaults to ethereum.
   * @param vsCurrency - The currency to fetch the spot prices in. Defaults to USD.
   * @returns The spot prices for the given token CAIP-19 IDs.
   */
  public async getSpotPrice(
    tokenCaip19Id: CaipAssetType = 'eip155:1/slip44:60',
    vsCurrency: VsCurrencyParam = 'usd',
  ): Promise<number> {
    // TODO: This endpoint take an array of CAIP-19 Compliant Asset IDs (comma-separated) but we are only passing one for now.
    // We can update this to take an array of CAIP-19 Compliant Asset IDs in the future.
    const response = await this.#fetch(
      `${
        this.#baseUrl
      }/v3/chain/spot-prices?includeMarketData=false&vsCurrency=${vsCurrency}&assetIds=${tokenCaip19Id}`,
    );

    if (!response.ok) {
      throw new Error(
        `HTTP error! Error in getSpotPrice for tokenCaip19Id:${tokenCaip19Id} and vsCurrency${vsCurrency}: ${response.status}`,
      );
    }

    const spotPricesRes = (await response.json()) as SpotPricesRes;

    const data = spotPricesRes[tokenCaip19Id];
    if (!data) {
      logger.error(
        `No spot price found for the token CAIP-19 ID: ${tokenCaip19Id}`,
      );
      throw new Error(
        `No spot price found for the token CAIP-19 ID: ${tokenCaip19Id}`,
      );
    }
    return data.price;
  }
}
