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

  it('should respect enabled state and custom filtering', async () => {
    // Test disabled state
    tracker.setEnabled(false);
    expect(tracker.isEnabled()).toBe(false);
    await tracker.captureError(new Error('Test'), 'testMethod');
    expect(mockSnapRequest).not.toHaveBeenCalled();

    // Test default filtering
    tracker.setEnabled(true);
    await tracker.captureError({}, 'testMethod'); // No error properties
    expect(mockSnapRequest).not.toHaveBeenCalled();

    // Test custom filter
    const customTracker = new SnapErrorTracker({
      ...defaultConfig,
      shouldTrackError: () => false,
    });
    await customTracker.captureError(new Error('Test'), 'testMethod');
    expect(mockSnapRequest).not.toHaveBeenCalled();
  });

  it('should handle tracking failures gracefully', async () => {
    mockSnapRequest.mockRejectedValue(new Error('Tracking failed'));
    const consoleWarnSpy = jest
      .spyOn(console, 'warn')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});

    await tracker.captureError(new Error('Test'), 'testMethod');
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should track response errors', async () => {
    // JSON-RPC error
    await tracker.captureResponseError(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Server error' } },
      'testMethod',
    );
    expect(mockSnapRequest).toHaveBeenCalled();

    jest.clearAllMocks();

    // Error status code
    await tracker.captureResponseError(
      { statusCode: 404, message: 'Not found' },
      'testMethod',
    );
    expect(mockSnapRequest).toHaveBeenCalled();

    jest.clearAllMocks();

    // Success response - should not track
    await tracker.captureResponseError(
      { statusCode: 200, data: 'success' },
      'testMethod',
    );
    expect(mockSnapRequest).not.toHaveBeenCalled();
  });

  it('should wrap async functions and create error handlers', async () => {
    // Test wrapAsync
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrapped = tracker.wrapAsync(mockFn, 'testMethod');
    const result = await wrapped('arg1');
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledWith('arg1');

    // Test error tracking in wrapped function
    mockFn.mockRejectedValue(new Error('Async error'));
    await expect(wrapped()).rejects.toThrow('Async error');
    expect(mockSnapRequest).toHaveBeenCalled();

    jest.clearAllMocks();

    // Test createRpcErrorHandler
    const handler = tracker.createRpcErrorHandler('rpcMethod');
    await handler(new Error('RPC error'));
    expect(mockSnapRequest).toHaveBeenCalled();
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

    // Should not track
    jest.clearAllMocks();
    await tracker.captureError({}, 'method');
    expect(mockSnapRequest).not.toHaveBeenCalled();

    await tracker.captureError(null, 'method');
    expect(mockSnapRequest).not.toHaveBeenCalled();
  });
});
