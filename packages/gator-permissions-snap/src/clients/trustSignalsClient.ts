import { z } from 'zod';

import { makeValidatedRequestWithRetry } from '../utils/httpClient';

/**
 * Recommended action from the dapp scanning API.
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
 * Schema for the dapp scanning API response.
 * Only validates the fields we use; recommendedAction may be missing or invalid.
 */
const DappScanningResponseSchema = z.object({
  status: z.string(),
  recommendedAction: z.string().optional(),
});

type DappScanningResponse = z.infer<typeof DappScanningResponseSchema>;

/**
 * Configuration options for TrustSignalsClient.
 * baseUrl is the dapp scanning API base URL when using that service.
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
 * Client for fetching trust signals. Presently uses the dapp scanning API.
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
   * Fetches the trust signal for the given origin via the dapp scanning API.
   * Only the scheme and host of the origin are sent (no path or query).
   *
   * @param origin - The origin to scan (e.g. "https://example.com" or "https://example.com/path?q=1").
   * @returns The scan result: isComplete is true only when status is "COMPLETE";
   * recommendedAction is set only when the API returns a valid value (BLOCK, WARN, NONE).
   */
  async fetchTrustSignal(origin: string): Promise<FetchTrustSignalResult> {
    const urlToScan = extractOriginSchemeAndHost(origin);
    const scanUrl = `${this.#baseUrl}/scan?url=${encodeURIComponent(urlToScan)}`;

    const parsed = await makeValidatedRequestWithRetry<
      DappScanningResponse,
      typeof DappScanningResponseSchema
    >(
      scanUrl,
      {
        timeoutMs: this.#timeoutMs,
        maxResponseSizeBytes: this.#maxResponseSizeBytes,
        fetch: this.#fetch,
      },
      DappScanningResponseSchema,
      { retries: 0 },
    );

    const isComplete = parsed.status === 'COMPLETE';
    
    if (!isComplete) {
      return { isComplete: false };
    }

    const recommendedAction =
      RECOMMENDED_ACTIONS.includes(parsed.recommendedAction ?? '')
        ? (parsed.recommendedAction as RecommendedAction)
        : RecommendedAction.NONE;

    return { isComplete: true, recommendedAction };
  }
}
