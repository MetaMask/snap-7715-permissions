// TODO: Add more currencies and locales that we support
export type Locale = 'en';

export type Preferences = {
  locale: Locale;
  currency: string;
};

// Default Preferences, to be used if there is not a valid translation in
// the requested locale.
export const FALLBACK_PREFERENCE: Preferences = {
  locale: 'en',
  currency: 'USD',
};

/**
 * Format a number as currency.
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
