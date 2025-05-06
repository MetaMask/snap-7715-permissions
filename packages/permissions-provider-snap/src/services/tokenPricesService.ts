import { logger } from '@metamask/7715-permissions-shared/utils';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';
import type { Hex } from 'viem';

import { type PriceApiClient } from '../clients/priceApiClient';
import type { VsCurrencyParam } from '../clients/types';
import { formatTokenBalance } from '../utils/balance';
import {
  FALLBACK_PREFERENCE,
  formatAsCurrency,
  type Preferences,
} from '../utils/locale';

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
   * Safely parse the user's preferences to determine the currency to use for the token prices.
   *
   * @param preferences - The user's preferences.
   * @returns The currency to use for the token prices.
   */
  #safeParsePreferences(preferences: Preferences): VsCurrencyParam {
    const { currency, locale } = preferences;
    return locale === 'en'
      ? (currency.toLowerCase() as VsCurrencyParam)
      : (FALLBACK_PREFERENCE.currency.toLowerCase() as VsCurrencyParam);
  }

  /**
   * Get the user's preferences.
   *
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
   *
   * @param tokenCaip19Type - The token CAIP-19 asset type to fetch spot prices for.
   * @param balance - The token balance.
   * @returns The value of the token balance in the user's preferred currency in human-readable format.
   */
  async getCryptoToFiatConversion(
    tokenCaip19Type: CaipAssetType,
    balance: Hex,
  ): Promise<string> {
    try {
      logger.debug('TokenPricesService:getCryptoToFiatConversion()');
      const preferences = await this.#getPreferences();

      // Value in fiat=(Amount in crypto)×(Spot price)
      const tokenSpotPrice = await this.#priceApiClient.getSpotPrice(
        tokenCaip19Type,
        this.#safeParsePreferences(preferences),
      );
      const formattedBalance = Number(formatTokenBalance(balance));
      const valueInFiat = formattedBalance * tokenSpotPrice;

      const humanReadableValue = formatAsCurrency(preferences, valueInFiat);
      logger.debug(
        'TokenPricesService:formatAsCurrency() - formatted balance to currency',
        humanReadableValue,
      );

      return humanReadableValue;
    } catch (error) {
      logger.error(
        'TokenPricesService:getCryptoToFiatConversion() - failed to fetch token spot price',
        error,
      );

      // TODO: Return a more user-friendly error message so failed calls to the Price API are handled gracefully
      // and do not make the entire permission request fail. We can use cached prices as a fallback to prevent this issue message in UI.
      return '$<-->';
    }
  }
}
