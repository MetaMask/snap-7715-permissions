import {
  SnapErrorTracker,
  createErrorTracker,
  getErrorTracker,
} from '../src/utils/errorTracking';
import type { ErrorTrackingConfig } from '../src/utils/errorTracking';

// Mock the global snap object
const mockSnapRequest = jest.fn();
(globalThis as any).snap = {
  request: mockSnapRequest,
};

describe('SnapErrorTracker', () => {
  let tracker: SnapErrorTracker;
  const defaultConfig: ErrorTrackingConfig = {
    enabled: true,
    snapName: 'test-snap',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapRequest.mockResolvedValue(undefined);
    tracker = new SnapErrorTracker(defaultConfig);
  });

  it('should track errors with various formats and metadata', async () => {
    // Error instance
    await tracker.captureError(new Error('Test error'), 'testMethod');
    expect(mockSnapRequest).toHaveBeenCalled();

    jest.clearAllMocks();

    // Error with metadata
    await tracker.captureError(
      {
        message: 'API Error',
        status: 404,
        currentUrl: 'https://example.com',
        response: { data: 'response data' },
      },
      'testMethod',
    );
    const errorMessage = mockSnapRequest.mock.calls[0][0].params.error.message;
    expect(errorMessage).toContain('404');
    expect(errorMessage).toContain('https://example.com');
  });

  it('should track requestParams when provided', async () => {
    const requestParams = { userId: '123', action: 'test' };
    await tracker.captureError(
      new Error('Test error'),
      'testMethod',
      requestParams,
    );
    expect(mockSnapRequest).toHaveBeenCalled();
    const errorMessage = mockSnapRequest.mock.calls[0][0].params.error.message;
    const errorInfo = JSON.parse(errorMessage);
    expect(errorInfo.requestParams).toStrictEqual(requestParams);
  });

  it('should extract requestParams from error object if not provided', async () => {
    const requestParams = { userId: '456', action: 'test2' };
    await tracker.captureError(
      {
        message: 'Error with params',
        requestParams,
      },
      'testMethod',
    );
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
    await disabledTracker.captureError(new Error('Test'), 'testMethod');
    expect(mockSnapRequest).not.toHaveBeenCalled();

    // Test default filtering
    await tracker.captureError({}, 'testMethod'); // No error properties
    expect(mockSnapRequest).not.toHaveBeenCalled();

    // Test custom filter
    const customTracker = new SnapErrorTracker({
      ...defaultConfig,
      shouldTrackError: (): boolean => false,
    });
    await customTracker.captureError(new Error('Test'), 'testMethod');
    expect(mockSnapRequest).not.toHaveBeenCalled();
  });

  it('should handle tracking failures gracefully', async () => {
    mockSnapRequest.mockRejectedValue(new Error('Tracking failed'));
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {
        /* empty */
      });

    await tracker.captureError(new Error('Test'), 'testMethod');
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });
});

describe('Singleton and default behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapRequest.mockResolvedValue(undefined);
  });

  it('should manage singleton instance', () => {
    const config: ErrorTrackingConfig = {
      enabled: true,
      snapName: 'singleton-test',
    };

    const tracker1 = createErrorTracker(config);
    const tracker2 = createErrorTracker(config);
    const tracker3 = getErrorTracker();

    expect(tracker1).toBe(tracker2);
    expect(tracker1).toBe(tracker3);
  });

  it('should apply default filtering rules', async () => {
    const tracker = new SnapErrorTracker({
      enabled: true,
      snapName: 'test-snap',
    });

    // Should track
    await tracker.captureError(new Error('Test'), 'method');
    expect(mockSnapRequest).toHaveBeenCalled();

    jest.clearAllMocks();
    await tracker.captureError({ message: 'Error' }, 'method');
    expect(mockSnapRequest).toHaveBeenCalled();

    jest.clearAllMocks();
    await tracker.captureError({ error: 'Error' }, 'method');
    expect(mockSnapRequest).toHaveBeenCalled();

    jest.clearAllMocks();
    // Should track even if message is empty string but error property exists
    await tracker.captureError({ message: '', error: 'something' }, 'method');
    expect(mockSnapRequest).toHaveBeenCalled();

    // Should not track
    jest.clearAllMocks();
    await tracker.captureError({}, 'method');
    expect(mockSnapRequest).not.toHaveBeenCalled();

    await tracker.captureError(null, 'method');
    expect(mockSnapRequest).not.toHaveBeenCalled();
  });
});
