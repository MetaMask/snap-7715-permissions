export type Locale = 'en';

export type Preferences = {
  locale: Locale;
  currency: string;
};

/**
 * Format a number as currency.
 *
 * @param preferences - The user's preferences.
 * @param value - The number to format.
 * @param decimalPlaces - The number of decimal places to display.
 * @returns The number formatted as currency.
 */
export const formatAsCurrency = (
  preferences: Preferences,
  value: number,
  decimalPlaces = 2,
): string => {
  return new Intl.NumberFormat(preferences.locale, {
    style: 'currency',
    currency: preferences.currency,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
};
