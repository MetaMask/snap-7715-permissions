import { logger } from '../../../shared/src/utils/logger';
import deLocale from '../../locales/de.json';
import elLocale from '../../locales/el.json';
import enLocale from '../../locales/en.json';
import es419Locale from '../../locales/es_419.json';
import frLocale from '../../locales/fr.json';
import hiLocale from '../../locales/hi.json';
import idLocale from '../../locales/id.json';
import jaLocale from '../../locales/ja.json';
import koLocale from '../../locales/ko.json';
import ptBRLocale from '../../locales/pt_BR.json';
import ruLocale from '../../locales/ru.json';
import tlLocale from '../../locales/tl.json';
import trLocale from '../../locales/tr.json';
import viLocale from '../../locales/vi.json';
import zhCNLocale from '../../locales/zh_CN.json';
// Type definitions
export type LocaleMessage = {
  message: string;
  description?: string;
};

export type LocaleMessages = {
  [key: string]: LocaleMessage;
};

export type MessageKey = keyof typeof enLocale.messages;
export type SupportedLocale =
  | 'en'
  | 'zh_CN'
  | 'fr'
  | 'de'
  | 'el'
  | 'hi'
  | 'id'
  | 'ja'
  | 'ko'
  | 'pt_BR'
  | 'ru'
  | 'es_419'
  | 'tl'
  | 'tr'
  | 'vi';

// All available locales
const locales: Record<SupportedLocale, LocaleMessages> = {
  en: enLocale.messages,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  zh_CN: zhCNLocale.messages,
  fr: frLocale.messages,
  de: deLocale.messages,
  el: elLocale.messages,
  hi: hiLocale.messages,
  id: idLocale.messages,
  ja: jaLocale.messages,
  ko: koLocale.messages,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  pt_BR: ptBRLocale.messages,
  ru: ruLocale.messages,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  es_419: es419Locale.messages,
  tl: tlLocale.messages,
  tr: trLocale.messages,
  vi: viLocale.messages,
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

      const userLocale = preferences.locale || FALLBACK_LOCALE;
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

  // Fallback to English if message doesn't exist or is empty
  if (!messageData?.message) {
    messageData = fallbackMessages[key];

    // Last resort: return the key itself (for debugging)
    if (!messageData?.message) {
      logger.warn(`Missing translation for key: ${String(key)}`);
      return String(key);
    }
  }

  const { message } = messageData;

  return substituteVariables(message, substitutions);
}

export type TranslateFunction = typeof t;

/**
 * Get current locale code.
 *
 * @returns Current locale code (e.g., 'en').
 */
export function getCurrentLocale(): SupportedLocale {
  return currentLocaleCode;
}
