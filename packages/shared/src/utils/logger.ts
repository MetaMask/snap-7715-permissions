import { bigIntToHex } from '@metamask/utils';

/**
 * Logging levels.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  DISABLED = 4,
}

/**
 * Log function signature.
 */
type LogFunction = (message?: unknown, ...optionalParams: unknown[]) => void;

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
  // Always enable DEBUG logging for debugging
  return LogLevel.DEBUG;

  // Original logic (commented out):
  // if (
  //   // eslint-disable-next-line no-restricted-globals
  //   process?.env?.NODE_ENV === 'production' &&
  //   // eslint-disable-next-line no-restricted-globals
  //   process?.env?.ENABLE_LOGGING !== 'true'
  // ) {
  //   return LogLevel.DISABLED;
  // }
  // // eslint-disable-next-line no-restricted-globals
  // if (process?.env?.NODE_ENV === 'development') {
  //   return LogLevel.DEBUG;
  // }
  // return LogLevel.WARN;
}

/**
 * Stringifies an object, converting BigInts to hex strings.
 *
 * @param data - The object to stringify.
 * @returns The stringified object.
 */
export const objStringify = (data: unknown): string => {
  return JSON.stringify(data, (_: unknown, value: unknown) => {
    if (typeof value === 'bigint') {
      return bigIntToHex(value);
    }
    return value;
  });
};

/**
 * Logger internal context.
 */
const DEFAULT_CONTEXT: LoggerContext = {
  threshold: getDefaultLevel(),
  handlers: {
    [LogLevel.DEBUG]: (message?: unknown, ...optionalParams: unknown[]) => {
      console.debug(message, ...optionalParams);
    },
    [LogLevel.INFO]: (message?: unknown, ...optionalParams: unknown[]) => {
      console.info(message, ...optionalParams);
    },
    [LogLevel.WARN]: (message?: unknown, ...optionalParams: unknown[]) => {
      console.warn(message, ...optionalParams);
    },
    [LogLevel.ERROR]: (message?: unknown, ...optionalParams: unknown[]) => {
      console.error(message, ...optionalParams);
    },
    [LogLevel.DISABLED]: () => {
      /* intentionally empty - logging disabled */
    },
  },
} as const;

export class Logger {
  #context: LoggerContext;

  constructor(context: Partial<LoggerContext> = {}) {
    this.#context = {
      ...DEFAULT_CONTEXT,
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
  #log(level: LogLevel, message?: unknown, ...optionalParams: unknown[]): void {
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
  debug(message?: unknown, ...optionalParams: unknown[]): void {
    this.#log(LogLevel.DEBUG, message, ...optionalParams);
  }

  /**
   * Logs an INFO message.
   *
   * @param message - Message to log.
   * @param optionalParams - Optional parameters to log.
   */
  info(message?: unknown, ...optionalParams: unknown[]): void {
    this.#log(LogLevel.INFO, message, ...optionalParams);
  }

  /**
   * Logs a WARN message.
   *
   * @param message - Message to log.
   * @param optionalParams - Optional parameters to log.
   */
  warn(message?: unknown, ...optionalParams: unknown[]): void {
    this.#log(LogLevel.WARN, message, ...optionalParams);
  }

  /**
   * Logs an ERROR message.
   *
   * @param message - Message to log.
   * @param optionalParams - Optional parameters to log.
   */
  error(message?: unknown, ...optionalParams: unknown[]): void {
    this.#log(LogLevel.ERROR, message, ...optionalParams);
  }
}

/**
 * Exported logger object.
 */
export const logger = new Logger();

export const logToFile = (
  message?: unknown,
  ...optionalParams: unknown[]
): void => {
  console.log(message, ...optionalParams);
};
