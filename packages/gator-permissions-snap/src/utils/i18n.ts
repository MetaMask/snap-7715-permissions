import { logger } from '../../../shared/src/utils/logger';
import enLocale from '../../locales/en.json';

// Type definitions
export type LocaleMessage = {
  message: string;
  description?: string;
};

export type LocaleMessages = {
  [key: string]: LocaleMessage;
};

export type MessageKey = keyof typeof enLocale.messages;
export type SupportedLocale = 'en';

// All available locales
const locales: Record<SupportedLocale, LocaleMessages> = {
  en: enLocale.messages,
};

// Fallback locale
const FALLBACK_LOCALE: SupportedLocale = 'en';

// Current locale state
let currentLocaleCode: SupportedLocale = FALLBACK_LOCALE;
let currentMessages: LocaleMessages | undefined;
const fallbackMessages: LocaleMessages | undefined = locales[FALLBACK_LOCALE];
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize i18n system by detecting user's locale and loading appropriate messages.
 * Must be called during snap lifecycle. Can be called multiple times safely.
 * Concurrent calls will wait for the same initialization to complete.
 *
 * @returns A promise that resolves when initialization is complete.
 */
export async function setupI18n(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      // Get user's locale preference
      const preferences = await snap.request({
        method: 'snap_getPreferences',
      });

      const userLocale = (preferences.locale || FALLBACK_LOCALE).toLowerCase();

      // If already initialized with the requested locale, skip re-initialization
      if (currentMessages && currentLocaleCode === userLocale) {
        return;
      }

      // Check if we support this locale
      if (userLocale in locales) {
        currentLocaleCode = userLocale as SupportedLocale;
        currentMessages = locales[currentLocaleCode];
      } else {
        // Try just the language code (e.g., 'en' from 'en-US')
        const languageCode = userLocale.split('-')[0];
        if (languageCode && languageCode in locales) {
          currentLocaleCode = languageCode as SupportedLocale;
          currentMessages = locales[currentLocaleCode];
        } else {
          // Fallback to English
          currentLocaleCode = FALLBACK_LOCALE;
          currentMessages = locales[FALLBACK_LOCALE];
        }
      }
    } catch (error) {
      // If we fail to fetch messages set them to English fallback.
      if (!currentMessages) {
        currentLocaleCode = FALLBACK_LOCALE;
        currentMessages = locales[FALLBACK_LOCALE];
      }
      logger.error('Failed to fetch user preferences for i18n', error);
    } finally {
      // eslint-disable-next-line require-atomic-updates
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

/**
 * Substitute variables in a message string.
 * Replaces $1, $2, etc. with provided values.
 *
 * @param message - The message string to process.
 * @param substitutions - Optional array of values to substitute.
 * @returns The message string with substitutions applied.
 */
function substituteVariables(
  message: string,
  substitutions?: string[],
): string {
  if (!substitutions || substitutions.length === 0) {
    return message;
  }

  return substitutions.reduce(
    (result, substitution, index) =>
      result.replace(new RegExp(`\\$${index + 1}`, 'gu'), substitution),
    message,
  );
}

/**
 * Get translated message by key with optional variable substitutions.
 *
 * Synchronous function inspired by MetaMask extension's getMessage().
 * Uses dual fallback system: current locale → English → key name.
 *
 * @param key - The message key to translate.
 * @param substitutions - Optional array of values to substitute ($1, $2, etc.).
 * @returns Translated and substituted message string.
 */
// eslint-disable-next-line id-length
export function t(key: MessageKey, substitutions?: string[]): string {
  // If i18n hasn't been initialized yet, return the key
  if (!currentMessages || !fallbackMessages) {
    logger.warn(`i18n not initialized yet, returning key: ${String(key)}`);
    return String(key);
  }

  // Try current locale first
  let messageData = currentMessages[key];

  if (!messageData) {
    // Fallback to English (like extension does)
    messageData = fallbackMessages[key];
  }

  if (!messageData?.message) {
    // Last resort: return the key itself (for debugging)
    logger.warn(`Missing translation for key: ${String(key)}`);
    return String(key);
  }

  const { message } = messageData;

  return substituteVariables(message, substitutions);
}

/**
 * Get current locale code.
 *
 * @returns Current locale code (e.g., 'en').
 */
export function getCurrentLocale(): SupportedLocale {
  return currentLocaleCode;
}
