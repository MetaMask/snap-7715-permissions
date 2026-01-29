import { getJsonError } from '@metamask/snaps-sdk';

import { logger } from './logger';

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
  snapProvider: any;
  shouldTrackError?: (error: any) => boolean;
};

/**
 * Error tracking service for snaps.
 * Provides a unified way to track and report errors across different snaps.
 */
export class SnapErrorTracker {
  readonly #enabled: boolean;

  readonly #snapName: string;

  readonly #snapProvider: any;

  readonly #shouldTrackError: (error: any) => boolean;

  constructor(config: ErrorTrackingConfig) {
    this.#enabled = config.enabled;
    this.#snapName = config.snapName;
    this.#snapProvider = config.snapProvider;
    this.#shouldTrackError =
      config.shouldTrackError ??
      ((error: any): boolean => {
        // By default, track Error instances, string errors, or objects with error-like properties
        return (
          error instanceof Error ||
          typeof error === 'string' ||
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

    // Handle different error formats (align with shouldTrackError: use !== undefined so
    // falsy values like '' or null are preserved for Sentry instead of "Unknown error")
    if (error instanceof Error) {
      errorInfo.errorMessage = error.message;
      errorInfo.errorStack = error.stack;
    } else if (typeof error === 'string') {
      errorInfo.errorMessage = error;
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      error.message !== undefined
    ) {
      errorInfo.errorMessage = String(error.message);
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      error.error !== undefined
    ) {
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
      if (this.#snapProvider?.request) {
        await this.#snapProvider.request({
          method: 'snap_trackError',
          params: {
            error: getJsonError(new Error(JSON.stringify(errorInfo))),
          },
        });
      }
    } catch (trackingError) {
      // Silently fail - don't let error tracking itself break the app
      logger.warn(
        '[SnapErrorTracker] Failed to track error via snap:',
        trackingError,
      );
    }
  }

  /**
   * Captures and tracks an error.
   *
   * @param errorData - The error data object containing error, method, and optional requestParams.
   * @param errorData.error - The error to capture.
   * @param errorData.method - The method/operation name.
   * @param errorData.requestParams - Optional request parameters that triggered the error.
   */
  async captureError({
    error,
    method,
    requestParams,
  }: {
    error: any;
    method: string;
    requestParams?: any;
  }): Promise<void> {
    if (!this.#enabled || !this.#shouldTrackError(error)) {
      return;
    }

    const errorInfo = this.#extractErrorInfo(error, method, requestParams);
    await this.#trackErrorViaSnap(errorInfo);
  }
}

/**
 * Creates an error tracker instance.
 *
 * @param config - Configuration for the error tracker.
 * @returns The error tracker instance.
 */
export function createErrorTracker(
  config: ErrorTrackingConfig,
): SnapErrorTracker {
  return new SnapErrorTracker(config);
}
