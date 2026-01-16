import { getJsonError } from '@metamask/snaps-sdk';

/**
 * Error information that will be tracked.
 */
export type ErrorTrackingInfo = {
  snapName: string;
  method: string;
  url?: string | undefined;
  statusCode?: number | undefined;
  errorMessage: string;
  errorStack?: string | undefined;
  responseData?: any | undefined;
  requestParams?: any | undefined;
};

/**
 * Error tracking service configuration.
 */
export type ErrorTrackingConfig = {
  enabled: boolean;
  snapName: string;
  shouldTrackError?: (error: any) => boolean;
};

/**
 * Error tracking service for snaps.
 * Provides a unified way to track and report errors across different snaps.
 */
export class SnapErrorTracker {
  #enabled: boolean;

  readonly #snapName: string;

  readonly #shouldTrackError: (error: any) => boolean;

  constructor(config: ErrorTrackingConfig) {
    this.#enabled = config.enabled;
    this.#snapName = config.snapName;
    this.#shouldTrackError =
      config.shouldTrackError ??
      ((error: any) => {
        // By default, track all errors that are Error instances or have error-like properties
        return (
          error instanceof Error ||
          (typeof error === 'object' && (error?.message ?? error?.error))
        );
      });
  }

  /**
   * Extracts error information from various error formats.
   *
   * @param error - The error to extract information from.
   * @param method - The method/operation that triggered the error.
   * @returns The extracted error information.
   */
  #extractErrorInfo(error: any, method: string): ErrorTrackingInfo {
    const errorInfo: ErrorTrackingInfo = {
      snapName: this.#snapName,
      method,
      errorMessage: 'Unknown error',
    };

    // Check if the error has a currentUrl property
    if (error?.currentUrl) {
      errorInfo.url = error.currentUrl;
    }

    // Handle different error formats
    if (error instanceof Error) {
      errorInfo.errorMessage = error.message;
      errorInfo.errorStack = error.stack;
    } else if (typeof error === 'string') {
      errorInfo.errorMessage = error;
    } else if (error?.message) {
      errorInfo.errorMessage = error.message;
    } else if (error?.error) {
      errorInfo.errorMessage =
        typeof error.error === 'string'
          ? error.error
          : JSON.stringify(error.error);
    }

    // Get status code if available
    if (error?.status) {
      errorInfo.statusCode = error.status;
    } else if (error?.statusCode) {
      errorInfo.statusCode = error.statusCode;
    }

    // Get response data if available
    if (error?.response) {
      errorInfo.responseData = error.response;
    } else if (error?.data) {
      errorInfo.responseData = error.data;
    }

    return errorInfo;
  }

  /**
   * Checks if a response indicates an error.
   *
   * @param response - The response to check.
   * @returns True if the response contains an error indicator.
   */
  #isErrorResponse(response: any): boolean {
    // Check for JSON-RPC errors
    if (
      response?.error ||
      (typeof response === 'object' && response?.jsonrpc && response?.error)
    ) {
      return true;
    }

    // Check for error status codes in response
    if (response?.statusCode && response.statusCode >= 400) {
      return true;
    }

    return false;
  }

  /**
   * Tracks an error using the snap's error tracking mechanism.
   * This function safely handles error tracking without throwing additional errors.
   *
   * @param errorInfo - The error information to track.
   */
  async #trackErrorViaSnap(errorInfo: ErrorTrackingInfo): Promise<void> {
    try {
      // Use snap_trackError if available
      if (typeof snap !== 'undefined' && snap?.request) {
        await snap.request({
          method: 'snap_trackError',
          params: {
            error: getJsonError(new Error(JSON.stringify(errorInfo))),
          },
        });
      }
    } catch (trackingError) {
      // Silently fail - don't let error tracking itself break the app
      console.warn(
        '[SnapErrorTracker] Failed to track error via snap:',
        trackingError,
      );
    }
  }

  /**
   * Captures and tracks an error.
   *
   * @param error - The error to capture.
   * @param method - The method/operation name.
   */
  async captureError(error: any, method: string): Promise<void> {
    if (!this.#enabled || !this.#shouldTrackError(error)) {
      return;
    }

    const errorInfo = this.#extractErrorInfo(error, method);
    await this.#trackErrorViaSnap(errorInfo);
  }

  /**
   * Captures an error in a response that returned a 2xx status code.
   *
   * @param response - The response object.
   * @param method - The method/operation name.
   */
  async captureResponseError(response: any, method: string): Promise<void> {
    if (!this.#enabled || !this.#isErrorResponse(response)) {
      return;
    }

    const errorInfo: ErrorTrackingInfo = {
      snapName: this.#snapName,
      method,
      errorMessage: `Response error: ${JSON.stringify(response)}`,
      responseData: response,
    };

    await this.#trackErrorViaSnap(errorInfo);
  }

  /**
   * Wraps an async function with error tracking.
   *
   * @param fn - The function to wrap.
   * @param methodName - The name of the method (for error tracking).
   * @returns The wrapped function.
   */
  wrapAsync<TFn extends (...args: any[]) => Promise<any>>(
    fn: TFn,
    methodName: string,
  ): TFn {
    return (async (...args: any[]) => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.captureError(error, methodName);
        throw error;
      }
    }) as TFn;
  }

  /**
   * Creates a middleware-style error handler for RPC methods.
   * Returns the original error to maintain error flow.
   *
   * @param methodName - The RPC method name.
   * @returns An error handler function.
   */
  createRpcErrorHandler(methodName: string): (error: any) => Promise<void> {
    return async (error: any) => {
      await this.captureError(error, methodName);
    };
  }

  /**
   * Sets whether error tracking is enabled.
   *
   * @param enabled - Whether to enable error tracking.
   */
  setEnabled(enabled: boolean): void {
    this.#enabled = enabled;
  }

  /**
   * Gets the current enabled state.
   *
   * @returns Whether error tracking is currently enabled.
   */
  isEnabled(): boolean {
    return this.#enabled;
  }
}

/**
 * Creates and returns a singleton error tracker instance.
 *
 * @param config - Configuration for the error tracker.
 * @returns The error tracker instance.
 */
let errorTrackerInstance: SnapErrorTracker | null = null;

/**
 * Creates a singleton error tracker instance.
 *
 * @param config - Configuration for the error tracker.
 * @returns The singleton error tracker instance.
 */
export function createErrorTracker(
  config: ErrorTrackingConfig,
): SnapErrorTracker {
  if (!errorTrackerInstance) {
    errorTrackerInstance = new SnapErrorTracker(config);
  }
  return errorTrackerInstance;
}

/**
 * Gets the current error tracker instance.
 *
 * @returns The error tracker instance.
 */
export function getErrorTracker(): SnapErrorTracker {
  if (!errorTrackerInstance) {
    throw new Error(
      'Error tracker not initialized. Call createErrorTracker with config first.',
    );
  }
  return errorTrackerInstance;
}
