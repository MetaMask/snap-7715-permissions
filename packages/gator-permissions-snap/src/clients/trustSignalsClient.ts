import { z } from 'zod';

import { makeValidatedRequestWithRetry } from '../utils/httpClient';

/**
 * Recommended action from the trust signals scan API.
 */
export enum RecommendedAction {
  BLOCK = 'BLOCK',
  WARN = 'WARN',
  NONE = 'NONE',
}

const RECOMMENDED_ACTIONS: readonly string[] = Object.values(RecommendedAction);

/**
 * Result of fetching a trust signal for an origin.
 */
export type FetchTrustSignalResult =
  | {
      isComplete: true;
      recommendedAction: RecommendedAction;
    }
  | {
      isComplete: false;
    };

/**
 * Schema for the trust signals scan API response.
 * Only validates the fields we use; recommendedAction may be missing or invalid.
 */
const TrustSignalsResponseSchema = z.object({
  status: z.string(),
  recommendedAction: z.string().optional(),
});

type TrustSignalsResponse = z.infer<typeof TrustSignalsResponseSchema>;

/**
 * Configuration options for TrustSignalsClient.
 */
export type TrustSignalsClientConfig = {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
  timeoutMs: number;
  maxResponseSizeBytes: number;
};

/**
 * Extracts scheme and host (origin) from a full origin string, e.g. strips path and query.
 * @param origin - Full origin or URL string (e.g. "https://example.com/path?query=1").
 * @returns Origin with only scheme and host (e.g. "https://example.com").
 */
export function extractOriginSchemeAndHost(origin: string): string {
  const url = new URL(origin);
  return url.origin;
}

/**
 * Client for the trust signals scan API.
 */
export class TrustSignalsClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #baseUrl: string;

  readonly #timeoutMs: number;

  readonly #maxResponseSizeBytes: number;

  constructor({
    baseUrl,
    fetch: fetchFn = globalThis.fetch,
    timeoutMs,
    maxResponseSizeBytes,
  }: TrustSignalsClientConfig) {
    this.#fetch = fetchFn;
    this.#baseUrl = baseUrl.replace(/\/+$/u, '');
    this.#timeoutMs = timeoutMs;
    this.#maxResponseSizeBytes = maxResponseSizeBytes;
  }

  /**
   * Fetches the trust signal for the given origin.
   * Only the scheme and host of the origin are sent to the API (no path or query).
   *
   * @param origin - The origin to scan (e.g. "https://example.com" or "https://example.com/path?q=1").
   * @returns The scan result: isComplete is true only when status is "COMPLETE";
   * recommendedAction is set only when the API returns a valid value (BLOCK, WARN, NONE).
   */
  async fetchTrustSignal(origin: string): Promise<FetchTrustSignalResult> {
    const urlToScan = extractOriginSchemeAndHost(origin);
    const scanUrl = `${this.#baseUrl}/scan?url=${encodeURIComponent(urlToScan)}`;

    const parsed = await makeValidatedRequestWithRetry<
      TrustSignalsResponse,
      typeof TrustSignalsResponseSchema
    >(
      scanUrl,
      {
        timeoutMs: this.#timeoutMs,
        maxResponseSizeBytes: this.#maxResponseSizeBytes,
        fetch: this.#fetch,
      },
      TrustSignalsResponseSchema,
      { retries: 0 },
    );

    const isComplete = parsed.status === 'COMPLETE';
    const recommendedAction =
      typeof parsed.recommendedAction === 'string' &&
      RECOMMENDED_ACTIONS.includes(parsed.recommendedAction)
        ? (parsed.recommendedAction as RecommendedAction)
        : null;

    return { isComplete, recommendedAction };
  }
}
