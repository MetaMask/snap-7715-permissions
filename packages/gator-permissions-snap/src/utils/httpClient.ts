import {
  InternalError,
  InvalidInputError,
  LimitExceededError,
  ParseError,
  ResourceNotFoundError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';
import type { z } from 'zod';

/**
 * Configuration for making HTTP requests with limits
 */
export type HttpClientConfig = {
  timeoutMs: number;
  maxResponseSizeBytes: number;
  fetch?: typeof globalThis.fetch;
};

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
export async function makeRequestWithLimits<TResponse>(
  url: string,
  config: HttpClientConfig,
  responseSchema: z.ZodSchema<TResponse>,
): Promise<TResponse> {
  const { timeoutMs, maxResponseSizeBytes, fetch = globalThis.fetch } = config;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response: globalThis.Response;

  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MetaMask-Snap/1.0',
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ResourceUnavailableError(
        `Request timed out after ${timeoutMs}ms`,
      );
    }

    throw new InternalError(
      `Failed to fetch resource: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  clearTimeout(timeoutId);

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
  const contentLength = response.headers.get('content-length');
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
