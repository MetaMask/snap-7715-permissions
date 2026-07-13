import { logger } from '@metamask/7715-permissions-shared/utils';
import { InternalError } from '@metamask/snaps-sdk';
import type { Hex } from '@metamask/utils';

import type {
  FetchAddressScanResult,
  ScanDappUrlResult,
  TrustSignalsClient,
} from '../../clients/trustSignalsClient';

type TrustSignalsResults = {
  scanDappUrlResult: ScanDappUrlResult | null;
  scanAddressResult: FetchAddressScanResult | null;
};

/**
 * Runs trust-signal scans in the background and tracks the latest results.
 * One instance per permission request; {@link start} and {@link onUpdate}
 * must each only be called once. Callers refresh confirmation UI when the
 * update callback fires.
 */
export class TrustSignalsCoordinator {
  readonly #trustSignalsClient: TrustSignalsClient;

  #scanDappUrlResult: ScanDappUrlResult | null = null;

  #scanAddressResult: FetchAddressScanResult | null = null;

  #started = false;

  #onUpdate: (() => void) | undefined;

  constructor({
    trustSignalsClient,
  }: {
    trustSignalsClient: TrustSignalsClient;
  }) {
    this.#trustSignalsClient = trustSignalsClient;
  }

  /**
   * Returns the latest scan results accumulated since {@link start}.
   *
   * @returns The latest dapp URL and address scan results, or null when pending.
   */
  getResults(): TrustSignalsResults {
    return {
      scanDappUrlResult: this.#scanDappUrlResult,
      scanAddressResult: this.#scanAddressResult,
    };
  }

  /**
   * Registers a callback invoked whenever a scan completes.
   * Safe to call after {@link start}; if any scan has already completed,
   * the callback is invoked immediately. Callers should read results via
   * {@link getResults}.
   *
   * @param callback - Called after each successful scan completion.
   * @throws If called more than once on the same instance.
   */
  onUpdate(callback: () => void): void {
    if (this.#onUpdate) {
      throw new InternalError(
        'TrustSignalsCoordinator onUpdate callback already registered',
      );
    }
    this.#onUpdate = callback;

    // Replay any completions that arrived before the callback was registered.
    if (this.#scanDappUrlResult !== null || this.#scanAddressResult !== null) {
      callback();
    }
  }

  /**
   * Starts non-blocking dapp URL and delegate address scans.
   * Completions invoke the callback registered via {@link onUpdate}, if any.
   *
   * @param args - Scan parameters.
   * @param args.origin - Site origin for dapp URL scanning.
   * @param args.chainId - Chain ID for address scanning.
   * @param args.delegateAddress - Delegate address to scan, if present.
   * @throws If called more than once on the same instance.
   */
  start(args: {
    origin: string;
    chainId: Hex;
    delegateAddress: string | undefined;
  }): void {
    if (this.#started) {
      throw new InternalError(
        'TrustSignalsCoordinator.start() called more than once',
      );
    }
    this.#started = true;

    const { origin, chainId, delegateAddress } = args;

    this.#trustSignalsClient
      .scanDappUrl(origin)
      .then((result) => {
        this.#scanDappUrlResult = result;
        this.#onUpdate?.();
        return result;
      })
      .catch((error: unknown) => {
        logger.debug('TrustSignalsCoordinator: dapp URL scan failed', {
          origin,
          error: error instanceof Error ? error.message : error,
        });
      });

    if (delegateAddress) {
      this.#trustSignalsClient
        .fetchAddressScan(chainId, delegateAddress)
        .then((result) => {
          this.#scanAddressResult = result;
          this.#onUpdate?.();
          return result;
        })
        .catch((error: unknown) => {
          logger.debug('TrustSignalsCoordinator: address scan failed', {
            address: delegateAddress,
            error: error instanceof Error ? error.message : error,
          });
        });
    }
  }
}
