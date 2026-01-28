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
      ((error: any): boolean => {
        // By default, track all errors that are Error instances or have error-like properties
        return (
          error instanceof Error ||
          (typeof error === 'object' &&
            error !== null &&
            (error?.message !== undefined || error?.error !== undefined))
        );
      });
  }

  /**
   * Extracts error information from various error formats.
   *
   * @param error - The error to extract information from.
   * @param method - The method/operation that triggered the error.
   * @param requestParams - Optional request parameters that triggered the error.
   * @returns The extracted error information.
   */
  #extractErrorInfo(
    error: any,
    method: string,
    requestParams?: any,
  ): ErrorTrackingInfo {
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
      if (typeof error.error === 'string') {
        errorInfo.errorMessage = error.error;
      } else {
        try {
          errorInfo.errorMessage = JSON.stringify(error.error);
        } catch {
          errorInfo.errorMessage = String(error.error);
        }
      }
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

    // Get request params if available (from parameter or error object)
    if (requestParams !== undefined) {
      errorInfo.requestParams = requestParams;
    } else if (error?.requestParams) {
      errorInfo.requestParams = error.requestParams;
    } else if (error?.params) {
      errorInfo.requestParams = error.params;
    }

    return errorInfo;
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
   * @param requestParams - Optional request parameters that triggered the error.
   */
  async captureError(
    error: any,
    method: string,
    requestParams?: any,
  ): Promise<void> {
    if (!this.#enabled || !this.#shouldTrackError(error)) {
      return;
    }

    const errorInfo = this.#extractErrorInfo(error, method, requestParams);
    await this.#trackErrorViaSnap(errorInfo);
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
  errorTrackerInstance ??= new SnapErrorTracker(config);
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
