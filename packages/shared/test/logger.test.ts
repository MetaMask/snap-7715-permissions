import { Logger, LogLevel, objStringify } from '../src/utils/logger';

describe('Logger', () => {
  let logger: Logger;
  let mockDebug: jest.Mock;
  let mockInfo: jest.Mock;
  let mockWarn: jest.Mock;
  let mockError: jest.Mock;

  beforeEach(() => {
    logger = new Logger();
    // Mock the console methods directly in the Logger instance
    mockDebug = jest.fn();
    mockInfo = jest.fn();
    mockWarn = jest.fn();
    mockError = jest.fn();

    // Override the logger's console methods
    logger = new Logger({
      handlers: {
        [LogLevel.DEBUG]: mockDebug,
        [LogLevel.INFO]: mockInfo,
        [LogLevel.WARN]: mockWarn,
        [LogLevel.ERROR]: mockError,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setLevel()', () => {
    it('should set the log level correctly', () => {
      logger.setLevel(LogLevel.INFO);
      expect(logger.getLevel()).toBe(LogLevel.INFO);
    });
  });

  describe('LogLevel.DEBUG', () => {
    beforeEach(() => {
      logger.setLevel(LogLevel.DEBUG);
    });

    it('should log DEBUG messages when threshold is DEBUG', () => {
      logger.debug('This is a debug message');
      expect(mockDebug).toHaveBeenCalledWith('This is a debug message');
    });

    it('should log INFO messages when threshold is DEBUG', () => {
      logger.info('This is an info message');
      expect(mockInfo).toHaveBeenCalledWith('This is an info message');
    });

    it('should log WARN messages when threshold is DEBUG', () => {
      logger.warn('This is a warning');
      expect(mockWarn).toHaveBeenCalledWith('This is a warning');
    });

    it('should log ERROR messages when threshold is DEBUG', () => {
      logger.error('This is an error');
      expect(mockError).toHaveBeenCalledWith('This is an error');
    });
  });

  describe('LogLevel.INFO', () => {
    beforeEach(() => {
      logger.setLevel(LogLevel.INFO);
    });

    it('should log INFO messages when threshold is INFO', () => {
      logger.info('This is an info message');
      expect(mockInfo).toHaveBeenCalledWith('This is an info message');
    });

    it('should log WARN messages when threshold is INFO', () => {
      logger.warn('This is a warning');
      expect(mockWarn).toHaveBeenCalledWith('This is a warning');
    });

    it('should log ERROR messages when threshold is INFO', () => {
      logger.error('This is an error');
      expect(mockError).toHaveBeenCalledWith('This is an error');
    });

    it('should not log DEBUG messages when threshold is INFO', () => {
      logger.debug('This is a debug message');
      expect(mockDebug).not.toHaveBeenCalled();
    });
  });

  describe('LogLevel.WARN', () => {
    beforeEach(() => {
      logger.setLevel(LogLevel.WARN);
    });

    it('should log WARN messages when threshold is WARN', () => {
      logger.warn('This is a warning');
      expect(mockWarn).toHaveBeenCalledWith('This is a warning');
    });

    it('should log ERROR messages when threshold is WARN', () => {
      logger.error('This is an error');
      expect(mockError).toHaveBeenCalledWith('This is an error');
    });

    it('should not log INFO messages when threshold is WARN', () => {
      logger.info('This is an info message');
      expect(mockInfo).not.toHaveBeenCalled();
    });

    it('should not log DEBUG messages when threshold is WARN', () => {
      logger.debug('This is a debug message');
      expect(mockDebug).not.toHaveBeenCalled();
    });
  });

  describe('LogLevel.ERROR', () => {
    beforeEach(() => {
      logger.setLevel(LogLevel.ERROR);
    });

    it('should log ERROR messages when threshold is ERROR', () => {
      logger.error('This is an error');
      expect(mockError).toHaveBeenCalledWith('This is an error');
    });

    it('should not log WARN messages when threshold is ERROR', () => {
      logger.warn('This is a warning');
      expect(mockWarn).not.toHaveBeenCalled();
    });

    it('should not log INFO messages when threshold is ERROR', () => {
      logger.info('This is an info message');
      expect(mockInfo).not.toHaveBeenCalled();
    });

    it('should not log DEBUG messages when threshold is ERROR', () => {
      logger.debug('This is a debug message');
      expect(mockDebug).not.toHaveBeenCalled();
    });
  });
});

describe('objStringify', () => {
  it('should convert BigInt values to hex strings', () => {
    const obj = { bigIntValue: BigInt(123) };
    const result = objStringify(obj);
    expect(result).toBe('{"bigIntValue":"0x7b"}');
  });

  it('should not affect non-BigInt values', () => {
    const obj = { stringValue: 'test', numberValue: 123 };
    const result = objStringify(obj);
    expect(result).toBe('{"stringValue":"test","numberValue":123}');
  });

  it('should handle mixed types', () => {
    const obj = { bigIntValue: BigInt(9876543210), message: 'hello' };
    const result = objStringify(obj);
    expect(result).toBe('{"bigIntValue":"0x24cb016ea","message":"hello"}');
  });
});

describe('Production Logging Behavior', () => {
  let originalNodeEnv: string | undefined;
  let originalEnableLogging: string | undefined;

  beforeEach(() => {
    // Store original environment variables
    // eslint-disable-next-line no-restricted-globals
    originalNodeEnv = process.env.NODE_ENV;
    // eslint-disable-next-line no-restricted-globals
    originalEnableLogging = process.env.ENABLE_LOGGING;
  });

  afterEach(() => {
    // Restore original environment variables
    // eslint-disable-next-line no-restricted-globals, no-negated-condition
    if (originalNodeEnv !== undefined) {
      // eslint-disable-next-line no-restricted-globals
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      // eslint-disable-next-line no-restricted-globals
      delete process.env.NODE_ENV;
    }

    // eslint-disable-next-line no-restricted-globals, no-negated-condition
    if (originalEnableLogging !== undefined) {
      // eslint-disable-next-line no-restricted-globals
      process.env.ENABLE_LOGGING = originalEnableLogging;
    } else {
      // eslint-disable-next-line no-restricted-globals
      delete process.env.ENABLE_LOGGING;
    }
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      // eslint-disable-next-line no-restricted-globals
      process.env.NODE_ENV = 'production';
      // eslint-disable-next-line no-restricted-globals
      delete process.env.ENABLE_LOGGING;
    });

    it('should disable all logging in production by default', () => {
      const logger = new Logger();

      // The default level should be higher than ERROR, effectively disabling all logging
      expect(logger.getLevel()).toBeGreaterThan(LogLevel.ERROR);
    });

    it('should not log any messages in production by default', () => {
      const mockDebug = jest.fn();
      const mockInfo = jest.fn();
      const mockWarn = jest.fn();
      const mockError = jest.fn();

      const logger = new Logger({
        handlers: {
          [LogLevel.DEBUG]: mockDebug,
          [LogLevel.INFO]: mockInfo,
          [LogLevel.WARN]: mockWarn,
          [LogLevel.ERROR]: mockError,
        },
      });

      // Try to log at all levels
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      // None should be called
      expect(mockDebug).not.toHaveBeenCalled();
      expect(mockInfo).not.toHaveBeenCalled();
      expect(mockWarn).not.toHaveBeenCalled();
      expect(mockError).not.toHaveBeenCalled();
    });

    it('should enable logging in production when ENABLE_LOGGING=true', () => {
      // eslint-disable-next-line no-restricted-globals
      process.env.ENABLE_LOGGING = 'true';

      const logger = new Logger();

      // Should use WARN level in production when explicitly enabled
      expect(logger.getLevel()).toBe(LogLevel.WARN);
    });

    it('should log WARN and ERROR messages when ENABLE_LOGGING=true in production', () => {
      // eslint-disable-next-line no-restricted-globals
      process.env.ENABLE_LOGGING = 'true';

      const mockDebug = jest.fn();
      const mockInfo = jest.fn();
      const mockWarn = jest.fn();
      const mockError = jest.fn();

      const logger = new Logger({
        handlers: {
          [LogLevel.DEBUG]: mockDebug,
          [LogLevel.INFO]: mockInfo,
          [LogLevel.WARN]: mockWarn,
          [LogLevel.ERROR]: mockError,
        },
      });

      // Try to log at all levels
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      // Only WARN and ERROR should be called
      expect(mockDebug).not.toHaveBeenCalled();
      expect(mockInfo).not.toHaveBeenCalled();
      expect(mockWarn).toHaveBeenCalledWith('Warning message');
      expect(mockError).toHaveBeenCalledWith('Error message');
    });
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      // eslint-disable-next-line no-restricted-globals
      process.env.NODE_ENV = 'development';
      // eslint-disable-next-line no-restricted-globals
      delete process.env.ENABLE_LOGGING;
    });

    it('should enable DEBUG level logging in development', () => {
      const logger = new Logger();
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });

    it('should log all messages in development', () => {
      const mockDebug = jest.fn();
      const mockInfo = jest.fn();
      const mockWarn = jest.fn();
      const mockError = jest.fn();

      const logger = new Logger({
        handlers: {
          [LogLevel.DEBUG]: mockDebug,
          [LogLevel.INFO]: mockInfo,
          [LogLevel.WARN]: mockWarn,
          [LogLevel.ERROR]: mockError,
        },
      });

      // Try to log at all levels
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      // All should be called
      expect(mockDebug).toHaveBeenCalledWith('Debug message');
      expect(mockInfo).toHaveBeenCalledWith('Info message');
      expect(mockWarn).toHaveBeenCalledWith('Warning message');
      expect(mockError).toHaveBeenCalledWith('Error message');
    });
  });
});
