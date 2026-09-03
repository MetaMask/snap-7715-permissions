import { ZERO_ADDRESS } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import { InternalError } from '@metamask/snaps-sdk';
import type { CaipAccountId, CaipAssetType } from '@metamask/snaps-sdk';
import {
  bigIntToHex,
  isStrictHexString,
  parseCaipAccountId,
  parseCaipAssetType,
} from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type { TokenMetadataService } from '../../services/tokenMetadataService';
import type { TokenPricesService } from '../../services/tokenPricesService';
import { formatUnits } from '../../utils/value';
import { createCallOnceGuard } from '../callOnceGuard';
import type { ResolvedTokenBalance, ResolvedTokenMetadata } from '../types';

type MetadataEntry =
  | { status: 'pending' }
  | { status: 'ready'; metadata: ResolvedTokenMetadata }
  | { status: 'failed' };

/**
 * Resolves a CAIP-19 asset type to chain ID and optional ERC-20 asset address.
 * @param caip19 - The CAIP-19 asset identifier.
 * @returns Chain ID and asset address for metadata service calls.
 */
export function caip19ToFetchParams(caip19: CaipAssetType): {
  chainId: number;
  assetAddress: Hex | undefined;
} {
  const {
    assetReference,
    chain: { reference: chainId },
  } = parseCaipAssetType(caip19);

  const assetAddress = isStrictHexString(assetReference)
    ? assetReference
    : undefined;

  return {
    chainId: parseInt(chainId, 10),
    assetAddress,
  };
}

const balanceCacheKey = ({
  accountCaip10,
  caip19,
}: {
  accountCaip10: CaipAccountId;
  caip19: CaipAssetType;
}): string => `${accountCaip10}|${caip19}`;

/**
 * Runs token metadata fetches for a permission request and serves on-demand
 * balance reads. One instance per permission request; {@link start} and
 * {@link onUpdate} must each only be called once. Callers refresh confirmation
 * UI when the update callback fires.
 */
export class TokenMetadataCoordinator {
  readonly #tokenMetadataService: TokenMetadataService;

  readonly #tokenPricesService: TokenPricesService;

  readonly #metadataByCaip19 = new Map<CaipAssetType, MetadataEntry>();

  readonly #metadataPromises = new Map<
    CaipAssetType,
    Promise<ResolvedTokenMetadata>
  >();

  readonly #balancePromises = new Map<string, Promise<ResolvedTokenBalance>>();

  readonly #callOnceGuard = createCallOnceGuard(
    'TokenMetadataCoordinator.start()',
  );

  #onUpdate: (() => void) | undefined;

  constructor({
    tokenMetadataService,
    tokenPricesService,
  }: {
    tokenMetadataService: TokenMetadataService;
    tokenPricesService: TokenPricesService;
  }) {
    this.#tokenMetadataService = tokenMetadataService;
    this.#tokenPricesService = tokenPricesService;
  }

  /**
   * Registers a callback invoked whenever a metadata fetch completes after
   * registration. Safe to call after {@link start}; callers that register after
   * early completions should read settled results via {@link getMetadata}
   * themselves.
   * @param callback - Called after each metadata fetch completion, success or failure.
   * @throws If called more than once on the same instance.
   */
  onUpdate(callback: () => void): void {
    if (this.#onUpdate) {
      throw new InternalError(
        'TokenMetadataCoordinator onUpdate callback already registered',
      );
    }
    this.#onUpdate = callback;
  }

  /**
   * Fetches and caches metadata (including icon) for a token before context formatting.
   * Joins an in-flight {@link start} fetch for the same CAIP-19 when one exists.
   * @param args - Token identity.
   * @param args.caip19 - The CAIP-19 asset identifier.
   * @returns Resolved token metadata.
   */
  async ensureMetadata(args: {
    caip19: CaipAssetType;
  }): Promise<ResolvedTokenMetadata> {
    return await this.#getOrFetchMetadata(args.caip19);
  }

  /**
   * Starts non-blocking metadata fetches for the request tokens.
   * Completions invoke the callback registered via {@link onUpdate}, if any.
   * @param args - Tokens whose metadata should be fetched.
   * @param args.tokenCaip19s - The CAIP-19 assets whose metadata is fetched.
   * @throws If called more than once on the same instance.
   */
  start(args: { tokenCaip19s: CaipAssetType[] }): void {
    this.#callOnceGuard();

    const uniqueCaip19s = [...new Set(args.tokenCaip19s)];

    for (const caip19 of uniqueCaip19s) {
      const existing = this.#metadataByCaip19.get(caip19);
      if (existing?.status === 'ready') {
        continue;
      }

      this.#getOrFetchMetadata(caip19)
        .then(() => {
          this.#onUpdate?.();
          return undefined;
        })
        .catch((error: unknown) => {
          logger.debug('TokenMetadataCoordinator: metadata fetch failed', {
            caip19,
            error: error instanceof Error ? error.message : error,
          });
          this.#onUpdate?.();
        });
    }
  }

  /**
   * Returns cached metadata for a CAIP-19 asset, if available.
   * @param caip19 - The CAIP-19 asset identifier.
   * @returns Resolved metadata or undefined when pending or unavailable.
   */
  getMetadata(caip19: CaipAssetType): ResolvedTokenMetadata | undefined {
    const entry = this.#metadataByCaip19.get(caip19);
    return entry?.status === 'ready' ? entry.metadata : undefined;
  }

  /**
   * Fetches and caches the token balance for an account and CAIP-19 asset.
   * Concurrent calls with the same arguments share one in-flight request.
   * @param args - Account and token to read.
   * @param args.accountCaip10 - The CAIP-10 account whose balance is fetched.
   * @param args.caip19 - The CAIP-19 asset whose balance is fetched.
   * @returns Resolved token balance.
   */
  async getBalance(args: {
    accountCaip10: CaipAccountId;
    caip19: CaipAssetType;
  }): Promise<ResolvedTokenBalance> {
    const key = balanceCacheKey(args);
    const inFlight = this.#balancePromises.get(key);
    if (inFlight) {
      return inFlight;
    }

    const promise = this.#fetchBalance(args).catch((error: unknown) => {
      this.#balancePromises.delete(key);
      logger.debug('TokenMetadataCoordinator: balance fetch failed', {
        caip19: args.caip19,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    });
    this.#balancePromises.set(key, promise);
    return promise;
  }

  async #getOrFetchMetadata(
    caip19: CaipAssetType,
  ): Promise<ResolvedTokenMetadata> {
    const existing = this.#metadataByCaip19.get(caip19);
    if (existing?.status === 'ready') {
      return Promise.resolve(existing.metadata);
    }

    const inFlight = this.#metadataPromises.get(caip19);
    if (inFlight) {
      return inFlight;
    }

    this.#metadataByCaip19.set(caip19, { status: 'pending' });
    const promise = this.#fetchMetadata(caip19)
      .then((metadata) => {
        this.#metadataByCaip19.set(caip19, { status: 'ready', metadata });
        return metadata;
      })
      .catch((error: unknown) => {
        this.#metadataByCaip19.set(caip19, { status: 'failed' });
        this.#metadataPromises.delete(caip19);
        throw error;
      });
    this.#metadataPromises.set(caip19, promise);
    return promise;
  }

  async #fetchMetadata(caip19: CaipAssetType): Promise<ResolvedTokenMetadata> {
    const { chainId, assetAddress } = caip19ToFetchParams(caip19);

    const { symbol, decimals, iconUrl } =
      await this.#tokenMetadataService.getTokenMetadata({
        chainId,
        ...(assetAddress !== undefined && { assetAddress }),
      });

    const iconDataResponse =
      await this.#tokenMetadataService.fetchIconDataAsBase64(iconUrl);

    return {
      symbol,
      decimals,
      iconDataBase64: iconDataResponse.ok
        ? iconDataResponse.imageDataBase64
        : null,
    };
  }

  async #fetchBalance(args: {
    accountCaip10: CaipAccountId;
    caip19: CaipAssetType;
  }): Promise<ResolvedTokenBalance> {
    const { address } = parseCaipAccountId(args.accountCaip10);
    const { chainId, assetAddress } = caip19ToFetchParams(args.caip19);

    const { balance, decimals } =
      await this.#tokenMetadataService.getTokenBalanceAndMetadata({
        chainId,
        account: address as Hex,
        assetAddress: assetAddress ?? ZERO_ADDRESS,
      });

    const formatted = formatUnits({ value: balance, decimals });
    const metadataDecimals =
      this.getMetadata(args.caip19)?.decimals ?? decimals;

    const fiat = await this.#tokenPricesService.getCryptoToFiatConversion(
      args.caip19,
      bigIntToHex(balance),
      metadataDecimals,
    );

    return {
      formatted,
      fiat,
    };
  }
}
