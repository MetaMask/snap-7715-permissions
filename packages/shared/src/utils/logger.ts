import { bigIntToHex } from '@metamask/utils';

/**
 * Logging levels.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log function signature.
 */
type LogFunction = (message?: any, ...optionalParams: any[]) => void;

/**
 * Logger context.
 */
type LoggerContext = {
  threshold: LogLevel;
  handlers: Record<LogLevel, LogFunction>;
};

/**
 * Returns the default logging level.
 * @returns The default logging level.
 */
function getDefaultLevel(): LogLevel {
  // Disable all logging in production unless explicitly enabled
  // eslint-disable-next-line no-restricted-globals
  const nodeEnv = process.env.NODE_ENV;
  // eslint-disable-next-line no-restricted-globals
  const enableLogging = process.env.ENABLE_LOGGING;

  if (nodeEnv === 'production' && enableLogging !== 'true') {
    return LogLevel.ERROR + 1; // Higher than ERROR to disable all logging
  }

  return nodeEnv === 'development' ? LogLevel.DEBUG : LogLevel.WARN;
}

/**
 * Logger internal context.
 */
const DEFAULT_CONTEXT: LoggerContext = {
  threshold: LogLevel.DEBUG, // Will be overridden in constructor
  handlers: {
    [LogLevel.DEBUG]: console.debug,
    [LogLevel.INFO]: console.info,
    [LogLevel.WARN]: console.warn,
    [LogLevel.ERROR]: console.error,
  },
} as const;

/**
 * Stringifies an object, converting BigInts to hex strings.
 *
 * @param data - The object to stringify.
 * @returns The stringified object.
 */
export const objStringify = (data: any) => {
  return JSON.stringify(data, (_: any, value: any) => {
    if (typeof value === 'bigint') {
      return bigIntToHex(value);
    }
    return value;
  });
};

export class Logger {
  #context: LoggerContext;

  constructor(context: Partial<LoggerContext> = {}) {
    this.#context = {
      ...DEFAULT_CONTEXT,
      threshold: context.threshold ?? getDefaultLevel(),
      ...context,
    };
  }

  /**
   * Sets the logging level.
   *
   * @param level - Log level to set.
   */
  setLevel(level: LogLevel): void {
    this.#context.threshold = level;
  }

  /**
   * Get the logging level.
   * @returns The set log level.
   */
  getLevel(): LogLevel {
    return this.#context.threshold;
  }

  /**
   * Logs a message at the specified level.
   *
   * @param level - Log level of the message.
   * @param message - Message to log.
   * @param optionalParams - Optional parameters to log.
   */
  #log(level: LogLevel, message?: any, ...optionalParams: any[]): void {
    const { threshold, handlers } = this.#context;
    if (level >= threshold) {
      handlers[level](message, ...optionalParams);
    }
  }

  /**
   * Logs a DEBUG message.
   *
   * @param message - Message to log.
   * @param optionalParams - Optional parameters to log.
   */
  debug(message?: any, ...optionalParams: any[]): void {
    this.#log(LogLevel.DEBUG, message, ...optionalParams);
  }

  /**
   * Logs an INFO message.
   *
   * @param message - Message to log.
   * @param optionalParams - Optional parameters to log.
   */
  info(message?: any, ...optionalParams: any[]): void {
    this.#log(LogLevel.INFO, message, ...optionalParams);
  }

  /**
   * Logs a WARN message.
   *
   * @param message - Message to log.
   * @param optionalParams - Optional parameters to log.
   */
  warn(message?: any, ...optionalParams: any[]): void {
    this.#log(LogLevel.WARN, message, ...optionalParams);
  }

  /**
   * Logs an ERROR message.
   *
   * @param message - Message to log.
   * @param optionalParams - Optional parameters to log.
   */
  error(message?: any, ...optionalParams: any[]): void {
    this.#log(LogLevel.ERROR, message, ...optionalParams);
  }
}

/**
 * Exported logger object.
 */
export const logger = new Logger();
