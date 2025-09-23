import {
  InternalError,
  InvalidInputError,
  LimitExceededError,
  ParseError,
  ResourceNotFoundError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';
import type { RetryOptions } from 'src/clients/types';
import type { z } from 'zod';

/**
 * Configuration for making HTTP requests with limits
 */
export type HttpClientConfig = {
  timeoutMs: number;
  maxResponseSizeBytes: number;
  fetch?: typeof globalThis.fetch;
  headers?: Record<string, string>;
};

/**
 * Makes an HTTP request with timeout and response size limits, and validates the response with Zod, with retry logic.
 * @param url - The URL to fetch.
 * @param config - Configuration for timeout, response size limits, and fetch function.
 * @param responseSchema - Zod schema to validate the response against.
 * @param retryOptions - Retry options.
 * @returns A promise that resolves to the validated response data.
 * @throws {ResourceUnavailableError} If the request times out, exceeds size limits, or server is unavailable.
 * @throws {ResourceNotFoundError} If the resource is not found (404).
 * @throws {InvalidInputError} If the request is invalid (4xx errors).
 * @throws {ParseError} If the response cannot be parsed as JSON.
 * @throws {ResourceUnavailableError} If the response structure is invalid according to the schema.
 */
export async function makeValidatedRequestWithRetry<
  TResponse,
  TSchema extends z.ZodType<TResponse, any, any>,
>(
  url: string,
  config: HttpClientConfig,
  responseSchema: TSchema,
  retryOptions?: RetryOptions,
): Promise<TResponse> {
  const { retries = 1, delayMs = 1000 } = retryOptions ?? {};

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await makeValidatedRequest(url, config, responseSchema);
    } catch (error) {
      if (error instanceof ResourceUnavailableError && attempt < retries) {
        await sleep(delayMs);
        continue;
      }
      throw error;
    }
  }

  throw new InternalError(
    `Failed to fetch resource after ${retries + 1} attempts`,
  );
}

/**
 * Makes an HTTP request with timeout and response size limits, and validates the response with Zod.
 * @param url - The URL to fetch.
 * @param config - Configuration for timeout, response size limits, and fetch function.
 * @param responseSchema - Zod schema to validate the response against.
 * @returns A promise that resolves to the validated response data.
 * @throws {ResourceUnavailableError} If the request times out, exceeds size limits, or server is unavailable.
 * @throws {ResourceNotFoundError} If the resource is not found (404).
 * @throws {InvalidInputError} If the request is invalid (4xx errors).
 * @throws {ParseError} If the response cannot be parsed as JSON.
 * @throws {ResourceUnavailableError} If the response structure is invalid according to the schema.
 */
async function makeValidatedRequest<
  TResponse,
  TSchema extends z.ZodType<TResponse, any, any>,
>(
  url: string,
  config: HttpClientConfig,
  responseSchema: TSchema,
): Promise<TResponse> {
  const { timeoutMs, maxResponseSizeBytes, fetch = globalThis.fetch } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response: globalThis.Response;

  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        ...config.headers,
        Accept: 'application/json',
        'User-Agent': 'MetaMask-Snap/1.0',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ResourceUnavailableError(
        `Request timed out after ${timeoutMs}ms`,
      );
    }

    throw new InternalError(
      `Failed to fetch resource: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Check HTTP status code
  if (!response.ok) {
    if (response.status === 404) {
      throw new ResourceNotFoundError(`Resource not found: ${response.status}`);
    } else if (isResourceUnavailableStatus(response.status)) {
      throw new ResourceUnavailableError(`Server error: ${response.status}`);
    } else if (response.status >= 400) {
      throw new InvalidInputError(`Client error: ${response.status}`);
    }
  }

  // Check response size before processing
  const contentLength = response.headers?.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxResponseSizeBytes) {
    throw new LimitExceededError(
      `Response too large: ${contentLength} bytes exceeds limit of ${maxResponseSizeBytes} bytes`,
    );
  }

  // Parse and validate the response with zod
  let responseData: unknown;
  try {
    responseData = await response.json();
  } catch (error) {
    throw new ParseError('Failed to parse JSON response');
  }

  // Validate response structure and content with zod
  try {
    return responseSchema.parse(responseData);
  } catch (error) {
    throw new InternalError('Invalid response structure');
  }
}

/**
 * Determines if an HTTP status code indicates a resource unavailable error.
 * @param statusCode - The HTTP status code to check.
 * @returns True if the status code indicates a resource unavailable error.
 */
export function isResourceUnavailableStatus(statusCode: number): boolean {
  return statusCode >= 500 || statusCode === 429 || statusCode === 408;
}

/**
 * Utility method to sleep for a specified number of milliseconds.
 * @param ms - The number of milliseconds to sleep.
 * @returns A promise that resolves after the specified delay.
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
