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
