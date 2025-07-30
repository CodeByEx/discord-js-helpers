import type { Dict, Logger } from '../types/index.js';

export interface I18nOptions {
  defaultLocale?: string;
  fallbackLocale?: string;
  logger?: Logger;
}

export interface I18nInstance {
  t(key: string, locale?: string, params?: Record<string, unknown>): string;
  locale: string;
  setLocale(locale: string): void;
  has(key: string, locale?: string): boolean;
}

/**
 * Create an i18n instance for locale-aware responses.
 * Provides simple internationalization for Discord bot responses.
 * 
 * @param locales - Dictionary of locale keys to translation objects
 * @param options - Configuration options
 * @returns I18nInstance
 * 
 * @example
 * ```typescript
 * import { createI18n } from 'discord-js-helpers';
 * 
 * const i18n = createI18n({
 *   en: {
 *     'welcome': 'Welcome to the server!',
 *     'ping': 'Pong! Latency: {latency}ms'
 *   },
 *   es: {
 *     'welcome': '¡Bienvenido al servidor!',
 *     'ping': '¡Pong! Latencia: {latency}ms'
 *   }
 * });
 * 
 * await interaction.reply(i18n.t('welcome', 'en'));
 * ```
 */
export function createI18n(locales: Dict, options: I18nOptions = {}): I18nInstance {
  const {
    defaultLocale = 'en',
    fallbackLocale = 'en',
    logger = createDefaultLogger()
  } = options;

  let currentLocale = defaultLocale;

  function interpolate(text: string, params: Record<string, unknown> = {}): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  function getTranslation(key: string, locale: string = currentLocale): string | null {
    const localeData = locales[locale];
    if (!localeData) {
      logger.warn(`Locale '${locale}' not found, falling back to '${fallbackLocale}'`);
      return locales[fallbackLocale]?.[key] || null;
    }
    return localeData[key] || null;
  }

  return {
    t(key: string, locale?: string, params?: Record<string, unknown>): string {
      const translation = getTranslation(key, locale);
      if (!translation) {
        logger.warn(`Translation key '${key}' not found for locale '${locale || currentLocale}'`);
        return key;
      }
      return interpolate(translation, params);
    },

    get locale() {
      return currentLocale;
    },

    setLocale(locale: string): void {
      if (locales[locale]) {
        currentLocale = locale;
        logger.info(`Locale set to '${locale}'`);
      } else {
        logger.warn(`Locale '${locale}' not found, keeping current locale '${currentLocale}'`);
      }
    },

    has(key: string, locale?: string): boolean {
      return getTranslation(key, locale) !== null;
    }
  };
}

/**
 * Get user's preferred locale from Discord.
 * Extracts locale from user's Discord settings.
 * 
 * @param user - Discord user object
 * @returns User's locale or fallback
 * 
 * @example
 * ```typescript
 * import { getUserLocale } from 'discord-js-helpers';
 * 
 * const userLocale = getUserLocale(interaction.user);
 * const message = i18n.t('welcome', userLocale);
 * ```
 */
export function getUserLocale(_user: unknown): string {
  // In a real implementation, this would check user preferences
  return 'en';
}

/**
 * Format number according to locale.
 * 
 * @param number - Number to format
 * @param locale - Locale for formatting
 * @returns Formatted number string
 */
export function formatNumber(number: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale).format(number);
}

/**
 * Format date according to locale.
 * 
 * @param date - Date to format
 * @param locale - Locale for formatting
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date, 
  locale: string = 'en', 
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Creates a default logger for i18n operations
 */
function createDefaultLogger(): Logger {
  return {
    debug: (message: string, ...args: unknown[]) => console.debug(`[I18N] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => console.info(`[I18N] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => console.warn(`[I18N] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => console.error(`[I18N] ${message}`, ...args),
  };
} 