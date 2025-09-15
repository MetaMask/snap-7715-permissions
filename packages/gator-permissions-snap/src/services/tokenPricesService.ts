import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/delegation-core';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';

import { type PriceApiClient } from '../clients/priceApiClient';
import type { VsCurrencyParam } from '../clients/types';
import { SUPPORTED_CURRENCIES } from '../constants';
import {
  FALLBACK_PREFERENCE,
  formatAsCurrency,
  type Preferences,
} from '../utils/locale';
import { formatUnits } from '../utils/value';

/**
 * Class responsible for fetching token prices and calculating the value of token balances.
 */
export class TokenPricesService {
  readonly #priceApiClient: PriceApiClient;
  // TODO: We can add a cache layer to reduce the number of requests to the Price API
  // This can improve latency and act as a fallback in case the Price API is down

  readonly #snapsProvider: SnapsProvider;

  constructor(priceApiClient: PriceApiClient, snapsProvider: SnapsProvider) {
    this.#priceApiClient = priceApiClient;
    this.#snapsProvider = snapsProvider;
  }

  /**
   * Check if a currency is supported by the Price API.
   * @param currency - The currency to check.
   * @returns True if the currency is supported, false otherwise.
   */
  #isSupportedCurrency(currency: string): boolean {
    return SUPPORTED_CURRENCIES.includes(currency);
  }

  /**
   * Safely parse the user's preferences to determine the currency to use for the token prices.
   * @param preferences - The user's preferences.
   * @returns The currency to use for the token prices.
   */
  #safeParsePreferences(preferences: Preferences): VsCurrencyParam {
    const { currency } = preferences;
    const normalizedCurrency = currency.toLowerCase();

    // Check if the currency is supported by the Price API
    if (this.#isSupportedCurrency(normalizedCurrency)) {
      return normalizedCurrency as VsCurrencyParam;
    }

    logger.debug(
      `TokenPricesService:#safeParsePreferences() - Currency "${currency}" not supported, falling back to USD`,
    );
    return FALLBACK_PREFERENCE.currency.toLowerCase() as VsCurrencyParam;
  }

  /**
   * Get the user's preferences.
   * @returns The user's preferences.
   */
  #getPreferences = async (): Promise<Preferences> => {
    const preferences = (await this.#snapsProvider.request({
      method: 'snap_getPreferences',
    })) as Preferences;
    logger.debug(
      'TokenPricesService:getVsCurrency() - found user preferences',
      preferences,
    );
    if (!preferences) {
      logger.debug(
        'TokenPricesService:getPreferences() - user preferences are empty, using fallback preferences',
      );
      return FALLBACK_PREFERENCE;
    }

    return preferences;
  };

  /**
   * Calculate the value of the token balance in the user's preferred currency.
   * - `from` is crypto and `to` is fiat.
   * @param tokenCaip19Type - The token CAIP-19 asset type to fetch spot prices for.
   * @param balance - The token balance.
   * @param decimals - The number of decimals the token uses.
   * @returns The value of the token balance in the user's preferred currency in human-readable format.
   */
  async getCryptoToFiatConversion(
    tokenCaip19Type: CaipAssetType,
    balance: Hex,
    decimals: number,
  ): Promise<string> {
    try {
      logger.debug('TokenPricesService:getCryptoToFiatConversion()');
      const preferences = await this.#getPreferences();

      // Get the currency to use for fetching prices
      const vsCurrency = this.#safeParsePreferences(preferences);

      // If we're falling back to USD, we need to update the preferences for formatting
      const formattingPreferences =
        vsCurrency === 'usd' && preferences.currency.toLowerCase() !== 'usd'
          ? { ...preferences, currency: 'USD' }
          : preferences;

      // Value in fiat=(Amount in crypto)×(Spot price)
      const tokenSpotPrice = await this.#priceApiClient.getSpotPrice(
        tokenCaip19Type,
        vsCurrency,
      );
      const formattedBalance = Number(
        formatUnits({ value: BigInt(balance), decimals }),
      );
      const valueInFiat = formattedBalance * tokenSpotPrice;

      const humanReadableValue = formatAsCurrency(
        formattingPreferences,
        valueInFiat,
      );
      logger.debug(
        'TokenPricesService:formatAsCurrency() - formatted balance to currency',
        humanReadableValue,
      );

      return humanReadableValue;
    } catch (error) {
      logger.error(
        'TokenPricesService:getCryptoToFiatConversion() - failed to fetch token spot price',
      );
      // If we can't fetch the price then show nothing.
      return ' ';
    }
  }
}
