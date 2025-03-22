import { logger } from '@metamask/7715-permissions-shared/utils';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';

import type { PriceApiClient } from '../clients';
import { formatAsCurrency, type Preferences } from '../locale';

export class TokenPricesService {
  readonly #priceApiClient: PriceApiClient;
  // TODO: We can add a cache layer to reduce the number of requests to the Price API
  // This can improve latency and act as a fallback in case the Price API is down

  readonly #snapsProvider: SnapsProvider;

  #preferences: Preferences | null = null;

  constructor(priceApiClient: PriceApiClient, snapsProvider: SnapsProvider) {
    this.#priceApiClient = priceApiClient;
    this.#snapsProvider = snapsProvider;
  }

  /**
   * Get the user's preferences.
   *
   * @returns The user's preferences.
   */
  #getPreferences = async (): Promise<Preferences> => {
    if (this.#preferences) {
      return this.#preferences;
    }
    const res = (await this.#snapsProvider.request({
      method: 'snap_getPreferences',
    })) as Preferences;

    this.#preferences = res;

    return res;
  };

  /**
   * Calculate the value of the token balance in the user's preferred currency.
   * - `from` is crypto and `to` is fiat.
   *
   * @param tokenCaip19Id - The token CAIP-19 ID to fetch spot prices for.
   * @param balance - The token balance.
   * @returns The value of the token balance in the user's preferred currency in human-readable format.
   */
  async getCryptoToFiatConversion(
    tokenCaip19Id: CaipAssetType,
    balance: Hex,
  ): Promise<string> {
    logger.debug('TokenPricesService:getCryptoToFiatConversion()');
    const preferences = await this.#getPreferences();
    logger.debug(
      'TokenPricesService:getCryptoToFiatConversion() - found user preferences',
      preferences,
    );

    // TODO: Calculate value of the token balance in the user's preferred currency
    // Value in fiat=(Amount in crypto)×(Spot price)

    const humanReadableValue = formatAsCurrency(preferences, 1000);
    logger.debug(
      'TokenPricesService:formatAsCurrency() - formatted balance to currency',
      humanReadableValue,
    );

    return humanReadableValue;
  }
}
