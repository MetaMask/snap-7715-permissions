import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  InternalError,
  InvalidInputError,
  LimitExceededError,
  ParseError,
  ResourceNotFoundError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/utils';
import { z } from 'zod';

import type { SpotPricesRes, VsCurrencyParam } from './types';

/**
 * Zod schema for validating spot prices response
 */
const SpotPricesResponseSchema = z.record(
  z.string().min(1).max(200), // CAIP asset type validation
  z.record(
    z.string().min(1).max(10), // Currency code validation
    z.number().finite().min(0).max(1e12), // Price validation (0 to 1 trillion)
  ),
);

/**
 * Options for configuring retry behavior.
 */
export type RetryOptions = {
  /** Number of retry attempts. */
  retries?: number;
  /** Delay between retries in milliseconds. */
  delayMs?: number;
};

/**
 * Configuration options for PriceApiClient
 */
export type PriceApiClientConfig = {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
  maxResponseSizeBytes?: number;
};

/**
 * Class responsible for fetching price data from the Price API.
 */
export class PriceApiClient {
  static readonly #defaultTimeoutMs = 10000; // 10 seconds

  static readonly #defaultMaxResponseSizeBytes = 1024 * 1024; // 1MB

  readonly #fetch: typeof globalThis.fetch;

  readonly #baseUrl: string;

  readonly #timeoutMs: number;

  readonly #maxResponseSizeBytes: number;

  constructor({
    baseUrl,
    fetch = globalThis.fetch,
    timeoutMs = PriceApiClient.#defaultTimeoutMs,
    maxResponseSizeBytes = PriceApiClient.#defaultMaxResponseSizeBytes,
  }: PriceApiClientConfig) {
    this.#fetch = fetch;
    this.#baseUrl = baseUrl.replace(/\/+$/u, ''); // Remove trailing slashes
    this.#timeoutMs = timeoutMs;
    this.#maxResponseSizeBytes = maxResponseSizeBytes;
  }

  /**
   * Makes a secure HTTP request with timeout and response size limits.
   * @param url - The URL to fetch.
   * @returns A promise that resolves to the response.
   * @throws {ResourceUnavailableError} If the request times out or exceeds size limits.
   */
  async #makeSecureRequest(url: string): Promise<globalThis.Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.#timeoutMs);

    try {
      const response = await this.#fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MetaMask-Snap/1.0',
        },
      });

      clearTimeout(timeoutId);

      // Check response size before processing
      const contentLength = response.headers.get('content-length');
      if (
        contentLength &&
        parseInt(contentLength, 10) > this.#maxResponseSizeBytes
      ) {
        throw new LimitExceededError(
          `Response too large: ${contentLength} bytes exceeds limit of ${this.#maxResponseSizeBytes} bytes`,
        );
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ResourceUnavailableError(
          `Request timed out after ${this.#timeoutMs}ms`,
        );
      }

      throw error;
    }
  }

  /**
   * Fetch the spot prices for the given token CAIP-19 asset type. If the request fails, it will retry
   * according to the retryOptions configuration.
   * @param caipAssetType - The token CAIP-19 asset type to fetch spot prices for.
   * @param vsCurrency - The currency to fetch the spot prices in. Defaults to USD.
   * @param retryOptions - Optional retry configuration. When not provided, defaults to 1 retry attempt with 1000ms delay.
   * @returns The spot prices for the given token CAIP-19 asset type.
   */
  public async getSpotPrice(
    caipAssetType: CaipAssetType,
    vsCurrency: VsCurrencyParam = 'usd',
    retryOptions?: RetryOptions,
  ): Promise<number> {
    // TODO: This endpoint take an array of CAIP-19 Compliant Asset IDs (comma-separated) but we are only passing one for now.
    // We can update this to take an array of CAIP-19 Compliant Asset IDs in the future.

    if (!caipAssetType) {
      logger.error(`No caipAssetType provided to fetch spot price`);
      throw new InvalidInputError(
        `No caipAssetType provided to fetch spot price`,
      );
    }

    const { retries = 1, delayMs = 1000 } = retryOptions ?? {};

    // Try up to initial attempt + retry attempts
    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await this.#fetchSpotPrice(caipAssetType, vsCurrency);
      // Process the response
      if (!response.ok) {
        logger.error(
          `HTTP error! Failed to fetch spot price for caipAssetType(${caipAssetType}) and vsCurrency(${vsCurrency}): ${response.status}`,
        );

        // Check if this is a retryable error
        if (
          this.#isResourceUnavailableStatus(response.status) &&
          attempt < retries
        ) {
          await this.#sleep(delayMs);
          continue;
        }

        // Throw appropriate error based on status code
        if (response.status === 404) {
          throw new ResourceNotFoundError(
            `Spot price not found for ${caipAssetType}`,
          );
        } else if (this.#isResourceUnavailableStatus(response.status)) {
          throw new ResourceUnavailableError(
            `Price service temporarily unavailable (HTTP ${response.status})`,
          );
        } else {
          throw new InvalidInputError(
            `HTTP error ${response.status}: Failed to fetch spot price for ${caipAssetType}`,
          );
        }
      }

      // Parse and validate the response with zod
      let responseData: unknown;
      try {
        responseData = await response.json();
      } catch (error) {
        const message = 'Failed to parse JSON response from spot price API';
        logger.error(message, error);
        throw new ParseError(message);
      }

      // Validate response structure and content with zod
      let validatedResponse: SpotPricesRes;
      try {
        validatedResponse = SpotPricesResponseSchema.parse(responseData);
      } catch (error) {
        const message = 'Invalid response structure from spot price API';
        logger.error(message, error);
        throw new ResourceUnavailableError(message);
      }

      // Try exact match first, then case-insensitive lookup
      let assetTypeData = validatedResponse[caipAssetType];
      if (!assetTypeData) {
        // If exact match fails, try case-insensitive lookup
        const responseKeys = Object.keys(validatedResponse);
        const matchingKey = responseKeys.find(
          (key) => key.toLowerCase() === caipAssetType.toLowerCase(),
        );

        if (matchingKey) {
          assetTypeData = validatedResponse[matchingKey as CaipAssetType];
        }
      }

      if (!assetTypeData) {
        logger.error(
          `No spot price found in result for the token CAIP-19 asset type: ${caipAssetType}. Available keys: ${Object.keys(validatedResponse).join(', ')}`,
        );
        throw new ResourceNotFoundError(
          `No spot price found in result for the token CAIP-19 asset type: ${caipAssetType}`,
        );
      }

      const vsCurrencyData = assetTypeData[vsCurrency];
      if (!vsCurrencyData) {
        logger.error(
          `No spot price found in result for the currency: ${vsCurrency}`,
        );
        throw new ResourceNotFoundError(
          `No spot price found in result for the currency: ${vsCurrency}`,
        );
      }

      return vsCurrencyData;
    }

    throw new InternalError(
      `Failed to fetch spot price after ${retries + 1} attempts`,
    );
  }

  /**
   * Internal method to fetch spot price and return the raw response.
   * @param caipAssetType - The token CAIP-19 asset type to fetch spot prices for.
   * @param vsCurrency - The currency to fetch the spot prices in.
   * @returns The raw fetch response.
   */
  async #fetchSpotPrice(
    caipAssetType: CaipAssetType,
    vsCurrency: VsCurrencyParam,
  ): Promise<globalThis.Response> {
    try {
      return this.#makeSecureRequest(
        `${
          this.#baseUrl
        }/v3/spot-prices?includeMarketData=false&vsCurrency=${vsCurrency}&assetIds=${caipAssetType}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Error fetching spot price: ${errorMessage}`);
      throw new InternalError(`Error fetching spot price: ${errorMessage}`);
    }
  }

  /**
   * Determines if an HTTP status code indicates a resource unavailable error.
   * @param statusCode - The HTTP status code to check.
   * @returns True if the status code indicates a resource unavailable error.
   */
  #isResourceUnavailableStatus(statusCode: number): boolean {
    return statusCode >= 500 || statusCode === 429 || statusCode === 408;
  }

  /**
   * Utility method to sleep for a specified number of milliseconds.
   * @param ms - The number of milliseconds to sleep.
   * @returns A promise that resolves after the specified delay.
   */
  async #sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
