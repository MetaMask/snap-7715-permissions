import { logger } from '@metamask/7715-permissions-shared/utils';
import { InternalError } from '@metamask/snaps-sdk';
import type { Hex } from '@metamask/utils';

import type {
  FetchAddressScanResult,
  ScanDappUrlResult,
  TrustSignalsClient,
} from '../../clients/trustSignalsClient';

/**
 * Runs trust-signal scans in the background and tracks the latest results.
 * One instance per permission request; {@link start} must only be called once.
 * Callers refresh confirmation UI when {@link TrustSignalsCoordinator.start}'s
 * `onResults` callback fires.
 */
export class TrustSignalsCoordinator {
  readonly #trustSignalsClient: TrustSignalsClient;

  #scanDappUrlResult: ScanDappUrlResult | null = null;

  #scanAddressResult: FetchAddressScanResult | null = null;

  #started = false;

  constructor({
    trustSignalsClient,
  }: {
    trustSignalsClient: TrustSignalsClient;
  }) {
    this.#trustSignalsClient = trustSignalsClient;
  }

  /**
   * Returns the latest scan results accumulated since the last {@link start} call.
   *
   * @returns The latest dapp URL and address scan results, or null when pending.
   */
  getResults(): {
    scanDappUrlResult: ScanDappUrlResult | null;
    scanAddressResult: FetchAddressScanResult | null;
  } {
    return {
      scanDappUrlResult: this.#scanDappUrlResult,
      scanAddressResult: this.#scanAddressResult,
    };
  }

  /**
   * Starts non-blocking dapp URL and delegate address scans.
   * Resets stored results, then invokes `onResults` whenever a scan completes.
   *
   * @param args - Scan parameters and callback for result updates.
   * @param args.origin - Site origin for dapp URL scanning.
   * @param args.chainId - Chain ID for address scanning.
   * @param args.delegateAddress - Delegate address to scan, if present.
   * @param args.onResults - Called with the latest combined results after each scan.
   * @throws If called more than once on the same instance.
   */
  start(args: {
    origin: string;
    chainId: Hex;
    delegateAddress: string | undefined;
    onResults: (results: {
      scanDappUrlResult: ScanDappUrlResult | null;
      scanAddressResult: FetchAddressScanResult | null;
    }) => void;
  }): void {
    if (this.#started) {
      throw new InternalError(
        'TrustSignalsCoordinator.start() called more than once',
      );
    }
    this.#started = true;

    const { origin, chainId, delegateAddress, onResults } = args;

    this.#scanDappUrlResult = null;
    this.#scanAddressResult = null;

    const notifyResults = (): void => {
      onResults(this.getResults());
    };

    this.#trustSignalsClient
      .scanDappUrl(origin)
      .then((result) => {
        this.#scanDappUrlResult = result;
        notifyResults();
        return result;
      })
      .catch((error: unknown) => {
        logger.debug(
          'TrustSignalsCoordinator: dapp URL scan or UI update failed',
          { origin, error: error instanceof Error ? error.message : error },
        );
      });

    if (delegateAddress) {
      this.#trustSignalsClient
        .fetchAddressScan(chainId, delegateAddress)
        .then((result) => {
          this.#scanAddressResult = result;
          notifyResults();
          return result;
        })
        .catch((error: unknown) => {
          logger.debug(
            'TrustSignalsCoordinator: address scan or UI update failed',
            {
              address: delegateAddress,
              error: error instanceof Error ? error.message : error,
            },
          );
        });
    }
  }
}
