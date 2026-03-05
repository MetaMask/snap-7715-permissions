import { z } from 'zod';

import {
  makeValidatedPostRequestWithRetry,
  makeValidatedRequestWithRetry,
} from '../utils/httpClient';

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
 * Chain ID (hex or 'solana') to security alerts API chain name.
 * Used to resolve chain for the security alerts API address scan.
 */
export const DEFAULT_CHAIN_ID_TO_NAME: Record<string, string> = {
  '0x1': 'ethereum',
  '0x89': 'polygon',
  '0x38': 'bsc',
  '0xa4b1': 'arbitrum',
  '0xa86a': 'avalanche',
  '0x2105': 'base',
  '0xa': 'optimism',
  '0x76adf1': 'zora',
  '0xe708': 'linea',
  '0x27bc86aa': 'degen',
  '0x144': 'zksync',
  '0x82750': 'scroll',
  '0x13e31': 'blast',
  '0x74c': 'soneium',
  '0x79a': 'soneium-minato',
  '0x14a34': 'base-sepolia',
  '0xab5': 'abstract',
  '0x849ea': 'zero-network',
  '0x138de': 'berachain',
  '0x82': 'unichain',
  '0x7e4': 'ronin',
  '0x127': 'hedera',
  '0x12c': 'zksync-sepolia',
  '0xaa36a7': 'ethereum-sepolia',
  '0xa869': 'avalanche-fuji',
  '0x343b': 'immutable-zkevm',
  '0x34a1': 'immutable-zkevm-testnet',
  '0x64': 'gnosis',
  '0x1e0': 'worldchain',
  '0x8173': 'apechain',
  '0x138c5': 'berachain-bartio',
  '0xdef1': 'ink',
  '0xba5ed': 'ink-sepolia',
  '0x2b74': 'abstract-testnet',
  '0x531': 'sei',
  '0x2eb': 'flow-evm',
  '0x8f': 'monad',
  '0x3e7': 'hyperevm',
  solana: 'solana',
};

/**
 * Result type of an address scan from the security alerts API.
 */
export enum AddressScanResultType {
  /** Address is benign/safe */
  Benign = 'Benign',
  /** Address has warning indicators */
  Warning = 'Warning',
  /** Address is malicious */
  Malicious = 'Malicious',
  /** Error occurred during scan (e.g. unsupported chain) */
  ErrorResult = 'ErrorResult',
}

const ADDRESS_SCAN_RESULT_TYPES: readonly string[] =
  Object.values(AddressScanResultType);

/**
 * Result of fetching an address scan from the security alerts API.
 */
export type FetchAddressScanResult = {
  result_type: AddressScanResultType;
  label: string;
};

/**
 * Schema for the security alerts API address scan response.
 */
const SecurityAlertsResponseSchema = z.object({
  result_type: z.string(),
  label: z.string(),
});

type SecurityAlertsResponse = z.infer<typeof SecurityAlertsResponseSchema>;

/**
 * Configuration options for TrustSignalsClient.
 * baseUrl is the dapp scanning API base URL; securityAlertsBaseUrl is the security alerts API base URL.
 */
export type TrustSignalsClientConfig = {
  baseUrl: string;
  securityAlertsBaseUrl: string;
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
 * Client for fetching trust signals. Uses the dapp scanning API and the security alerts API.
 */
export class TrustSignalsClient {
  readonly #fetch: typeof globalThis.fetch;

  readonly #baseUrl: string;

  readonly #securityAlertsBaseUrl: string;

  readonly #timeoutMs: number;

  readonly #maxResponseSizeBytes: number;

  constructor({
    baseUrl,
    securityAlertsBaseUrl,
    fetch: fetchFn = globalThis.fetch,
    timeoutMs,
    maxResponseSizeBytes,
  }: TrustSignalsClientConfig) {
    this.#fetch = fetchFn;
    this.#baseUrl = baseUrl.replace(/\/+$/u, '');
    this.#securityAlertsBaseUrl = securityAlertsBaseUrl.replace(/\/+$/u, '');
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

  /**
   * Fetches the address scan result for the given chain and address via the security alerts API.
   * If the chain is not in DEFAULT_CHAIN_ID_TO_NAME, returns ErrorResult with an empty label.
   *
   * @param chainId - Hex chain ID (e.g. "0x1") or "solana".
   * @param address - The address to scan.
   * @returns The scan result with result_type and label.
   */
  async fetchAddressScan(
    chainId: string,
    address: string,
  ): Promise<FetchAddressScanResult> {
    const chain = DEFAULT_CHAIN_ID_TO_NAME[chainId];
    if (chain === undefined) {
      return {
        result_type: AddressScanResultType.ErrorResult,
        label: '',
      };
    }

    const url = `${this.#securityAlertsBaseUrl}/address/evm/scan`;
    const parsed = await makeValidatedPostRequestWithRetry<
      SecurityAlertsResponse,
      typeof SecurityAlertsResponseSchema
    >(
      url,
      {
        timeoutMs: this.#timeoutMs,
        maxResponseSizeBytes: this.#maxResponseSizeBytes,
        fetch: this.#fetch,
      },
      { chain, address },
      SecurityAlertsResponseSchema,
      { retries: 0 },
    );

    const result_type = ADDRESS_SCAN_RESULT_TYPES.includes(parsed.result_type)
      ? (parsed.result_type as AddressScanResultType)
      : AddressScanResultType.ErrorResult;

    return {
      result_type,
      label: parsed.label,
    };
  }
}
