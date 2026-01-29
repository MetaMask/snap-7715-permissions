import {
  SnapErrorTracker,
  createErrorTracker,
} from '../src/utils/errorTracking';
import type { ErrorTrackingConfig } from '../src/utils/errorTracking';
import { logger } from '../src/utils/logger';

// Mock the snap provider
const mockSnapRequest = jest.fn();
const mockSnapProvider = {
  request: mockSnapRequest,
};

describe('SnapErrorTracker', () => {
  let tracker: SnapErrorTracker;
  const defaultConfig: ErrorTrackingConfig = {
    enabled: true,
    snapName: 'test-snap',
    snapProvider: mockSnapProvider,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapRequest.mockResolvedValue(undefined);
    tracker = new SnapErrorTracker(defaultConfig);
  });

  it('should track errors with various formats and metadata', async () => {
    // Error instance
    await tracker.captureError({
      error: new Error('Test error'),
      method: 'testMethod',
    });
    expect(mockSnapRequest).toHaveBeenCalled();

    jest.clearAllMocks();

    // Error with metadata
    await tracker.captureError({
      error: {
        message: 'API Error',
        status: 404,
        currentUrl: 'https://example.com',
        response: { data: 'response data' },
      },
      method: 'testMethod',
    });
    const errorMessage = mockSnapRequest.mock.calls[0][0].params.error.message;
    expect(errorMessage).toContain('404');
    expect(errorMessage).toContain('https://example.com');
  });

  it('should track string errors with default filter', async () => {
    await tracker.captureError({
      error: 'Something went wrong',
      method: 'testMethod',
    });
    expect(mockSnapRequest).toHaveBeenCalled();
    const errorMessage = mockSnapRequest.mock.calls[0][0].params.error.message;
    const errorInfo = JSON.parse(errorMessage);
    expect(errorInfo.errorMessage).toBe('Something went wrong');
  });

  it('should preserve falsy message values (empty string, null) instead of "Unknown error"', async () => {
    await tracker.captureError({
      error: { message: '' },
      method: 'testMethod',
    });
    expect(mockSnapRequest).toHaveBeenCalled();
    const emptyMsg = mockSnapRequest.mock.calls[0][0].params.error.message;
    const infoEmpty = JSON.parse(emptyMsg);
    expect(infoEmpty.errorMessage).toBe('');

    jest.clearAllMocks();
    await tracker.captureError({
      error: { message: null },
      method: 'testMethod',
    });
    expect(mockSnapRequest).toHaveBeenCalled();
    const nullMsg = mockSnapRequest.mock.calls[0][0].params.error.message;
    const infoNull = JSON.parse(nullMsg);
    expect(infoNull.errorMessage).toBe('null');
  });

  it('should track requestParams when provided', async () => {
    const requestParams = { userId: '123', action: 'test' };
    await tracker.captureError({
      error: new Error('Test error'),
      method: 'testMethod',
      requestParams,
    });
    expect(mockSnapRequest).toHaveBeenCalled();
    const errorMessage = mockSnapRequest.mock.calls[0][0].params.error.message;
    const errorInfo = JSON.parse(errorMessage);
    expect(errorInfo.requestParams).toStrictEqual(requestParams);
  });

  it('should extract requestParams from error object if not provided', async () => {
    const requestParams = { userId: '456', action: 'test2' };
    await tracker.captureError({
      error: {
        message: 'Error with params',
        requestParams,
      },
      method: 'testMethod',
    });
    expect(mockSnapRequest).toHaveBeenCalled();
    const errorMessage = mockSnapRequest.mock.calls[0][0].params.error.message;
    const errorInfo = JSON.parse(errorMessage);
    expect(errorInfo.requestParams).toStrictEqual(requestParams);
  });

  it('should respect enabled state and custom filtering', async () => {
    // Test disabled state
    const disabledTracker = new SnapErrorTracker({
      ...defaultConfig,
      enabled: false,
    });
    await disabledTracker.captureError({
      error: new Error('Test'),
      method: 'testMethod',
    });
    expect(mockSnapRequest).not.toHaveBeenCalled();

    // Test default filtering
    await tracker.captureError({ error: {}, method: 'testMethod' }); // No error properties
    expect(mockSnapRequest).not.toHaveBeenCalled();

    // Test custom filter
    const customTracker = new SnapErrorTracker({
      ...defaultConfig,
      shouldTrackError: (): boolean => false,
    });
    await customTracker.captureError({
      error: new Error('Test'),
      method: 'testMethod',
    });
    expect(mockSnapRequest).not.toHaveBeenCalled();
  });

  it('should not throw when custom shouldTrackError allows primitives', async () => {
    const permissiveTracker = new SnapErrorTracker({
      ...defaultConfig,
      shouldTrackError: (): boolean => true,
    });

    expect(
      await permissiveTracker.captureError({
        error: null,
        method: 'testMethod',
      }),
    ).toBeUndefined();
    expect(
      await permissiveTracker.captureError({
        error: undefined,
        method: 'testMethod',
      }),
    ).toBeUndefined();
    expect(
      await permissiveTracker.captureError({ error: 42, method: 'testMethod' }),
    ).toBeUndefined();
    expect(
      await permissiveTracker.captureError({
        error: true,
        method: 'testMethod',
      }),
    ).toBeUndefined();

    expect(mockSnapRequest).toHaveBeenCalled();
  });

  it('should handle tracking failures gracefully', async () => {
    mockSnapRequest.mockRejectedValue(new Error('Tracking failed'));
    const loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {
      /* empty */
    });

    await tracker.captureError({
      error: new Error('Test'),
      method: 'testMethod',
    });
    expect(loggerWarnSpy).toHaveBeenCalled();

    loggerWarnSpy.mockRestore();
  });
});

describe('Error tracker creation and default behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapRequest.mockResolvedValue(undefined);
  });

  it('should create independent instances', () => {
    const config: ErrorTrackingConfig = {
      enabled: true,
      snapName: 'test-snap',
      snapProvider: mockSnapProvider,
    };

    const tracker1 = createErrorTracker(config);
    const tracker2 = createErrorTracker(config);

    expect(tracker1).not.toBe(tracker2);
  });

  it('should apply default filtering rules', async () => {
    const tracker = new SnapErrorTracker({
      enabled: true,
      snapName: 'test-snap',
      snapProvider: mockSnapProvider,
    });

    // Should track
    await tracker.captureError({ error: new Error('Test'), method: 'method' });
    expect(mockSnapRequest).toHaveBeenCalled();

    jest.clearAllMocks();
    await tracker.captureError({
      error: { message: 'Error' },
      method: 'method',
    });
    expect(mockSnapRequest).toHaveBeenCalled();

    jest.clearAllMocks();
    await tracker.captureError({
      error: { error: 'Error' },
      method: 'method',
    });
    expect(mockSnapRequest).toHaveBeenCalled();

    jest.clearAllMocks();
    // Should track even if message is empty string but error property exists
    await tracker.captureError({
      error: { message: '', error: 'something' },
      method: 'method',
    });
    expect(mockSnapRequest).toHaveBeenCalled();

    // Should not track
    jest.clearAllMocks();
    await tracker.captureError({ error: {}, method: 'method' });
    expect(mockSnapRequest).not.toHaveBeenCalled();

    await tracker.captureError({ error: null, method: 'method' });
    expect(mockSnapRequest).not.toHaveBeenCalled();
  });
});
