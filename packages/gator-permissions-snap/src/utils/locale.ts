// data coming from https://github.com/MetaMask/metamask-extension/blob/main/app/_locales/index.json
export type Locale =
  | 'am'
  | 'ar'
  | 'bg'
  | 'bn'
  | 'ca'
  | 'cs'
  | 'da'
  | 'de'
  | 'el'
  | 'en'
  | 'es'
  | 'es_419'
  | 'et'
  | 'fa'
  | 'fi'
  | 'fil'
  | 'fr'
  | 'gu'
  | 'he'
  | 'hi'
  | 'hn'
  | 'hr'
  | 'ht'
  | 'hu'
  | 'id'
  | 'it'
  | 'ja'
  | 'kn'
  | 'ko'
  | 'lt'
  | 'lv'
  | 'ml'
  | 'mr'
  | 'ms'
  | 'nl'
  | 'no'
  | 'ph'
  | 'pl'
  | 'pt'
  | 'pt_BR'
  | 'pt_PT'
  | 'ro'
  | 'ru'
  | 'sk'
  | 'sl'
  | 'sr'
  | 'sv'
  | 'sw'
  | 'ta'
  | 'te'
  | 'th'
  | 'tl'
  | 'tr'
  | 'uk'
  | 'vi'
  | 'zh_CN'
  | 'zh_TW';

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
  // The replace('_', '-') ensures compatibility when metamask uses POSIX-style locale codes but needs to pass them to web APIs that expect BCP 47 format.
  return new Intl.NumberFormat(preferences.locale.replace('_', '-'), {
    style: 'currency',
    currency: preferences.currency,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
};
