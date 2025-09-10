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

describe('Logger Configuration', () => {
  describe('Explicit threshold configuration', () => {
    it('should use provided threshold when explicitly set', () => {
      const logger = new Logger({ threshold: LogLevel.ERROR });
      expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });

    it('should disable all logging when threshold is higher than ERROR', () => {
      const mockDebug = jest.fn();
      const mockInfo = jest.fn();
      const mockWarn = jest.fn();
      const mockError = jest.fn();

      const logger = new Logger({
        threshold: LogLevel.ERROR + 1, // Higher than ERROR
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

    it('should log only WARN and ERROR when threshold is WARN', () => {
      const mockDebug = jest.fn();
      const mockInfo = jest.fn();
      const mockWarn = jest.fn();
      const mockError = jest.fn();

      const logger = new Logger({
        threshold: LogLevel.WARN,
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

    it('should log all messages when threshold is DEBUG', () => {
      const mockDebug = jest.fn();
      const mockInfo = jest.fn();
      const mockWarn = jest.fn();
      const mockError = jest.fn();

      const logger = new Logger({
        threshold: LogLevel.DEBUG,
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

  describe('Default behavior', () => {
    it('should use default threshold when no configuration provided', () => {
      const logger = new Logger();
      // Should not be undefined and should be a valid LogLevel
      expect(logger.getLevel()).toBeDefined();
      expect(typeof logger.getLevel()).toBe('number');
      expect(logger.getLevel()).toBeGreaterThanOrEqual(LogLevel.DEBUG);
      expect(logger.getLevel()).toBeLessThanOrEqual(LogLevel.ERROR + 1);
    });

    it('should handle undefined threshold gracefully', () => {
      const logger = new Logger({});
      // Should not be undefined and should be a valid LogLevel
      expect(logger.getLevel()).toBeDefined();
      expect(typeof logger.getLevel()).toBe('number');
    });
  });
});
