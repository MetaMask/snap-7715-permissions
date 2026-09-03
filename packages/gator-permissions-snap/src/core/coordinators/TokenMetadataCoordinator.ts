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
import type { ResolvedTokenBalance, ResolvedTokenMetadata } from '../types';

type MetadataEntry =
  | { status: 'pending' }
  | { status: 'ready'; metadata: ResolvedTokenMetadata }
  | { status: 'failed' };

type BalanceEntry =
  | { status: 'pending' }
  | { status: 'ready'; balance: ResolvedTokenBalance }
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

/**
 * Runs token metadata and balance fetches for a permission request.
 * One instance per permission request; callers refresh UI via {@link onUpdate}.
 */
export class TokenMetadataCoordinator {
  readonly #tokenMetadataService: TokenMetadataService;

  readonly #tokenPricesService: TokenPricesService;

  readonly #metadataByCaip19 = new Map<CaipAssetType, MetadataEntry>();

  readonly #balanceByCaip19 = new Map<CaipAssetType, BalanceEntry>();

  #onUpdate: (() => void) | undefined;

  #accountCaip10: CaipAccountId | undefined;

  #balanceCaip19: CaipAssetType | undefined;

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
   * Registers a callback invoked whenever metadata or balance fetch completes.
   * @param callback - Called after each fetch completion, success or failure.
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
   * @param args - Token identity and account for icon/balance lookups.
   * @param args.caip19 - The CAIP-19 asset identifier.
   * @param args.accountCaip10 - The CAIP-10 account used for metadata lookups.
   * @returns Resolved token metadata.
   */
  async ensureMetadata(args: {
    caip19: CaipAssetType;
    accountCaip10: CaipAccountId;
  }): Promise<ResolvedTokenMetadata> {
    const existing = this.#metadataByCaip19.get(args.caip19);
    if (existing?.status === 'ready') {
      return existing.metadata;
    }

    this.#accountCaip10 = args.accountCaip10;

    const metadata = await this.#fetchMetadata(args.caip19);
    this.#metadataByCaip19.set(args.caip19, {
      status: 'ready',
      metadata,
    });
    return metadata;
  }

  /**
   * Registers tokens to track and (re)fetches metadata and optional balance.
   * @param args - Context account, token CAIP-19s, and balance token selector result.
   * @param args.accountCaip10 - The CAIP-10 account whose tokens are tracked.
   * @param args.tokenCaip19s - The CAIP-19 assets whose metadata is fetched.
   * @param args.balanceCaip19 - The optional CAIP-19 asset whose balance is fetched.
   */
  sync(args: {
    accountCaip10: CaipAccountId;
    tokenCaip19s: CaipAssetType[];
    balanceCaip19?: CaipAssetType | undefined;
  }): void {
    this.#accountCaip10 = args.accountCaip10;
    this.#balanceCaip19 = args.balanceCaip19;

    const uniqueCaip19s = [...new Set(args.tokenCaip19s)];

    for (const caip19 of uniqueCaip19s) {
      const existing = this.#metadataByCaip19.get(caip19);
      if (existing?.status === 'ready') {
        continue;
      }

      this.#metadataByCaip19.set(caip19, { status: 'pending' });
      this.#fetchMetadata(caip19)
        .then((metadata) => {
          this.#metadataByCaip19.set(caip19, { status: 'ready', metadata });
          this.#onUpdate?.();
          return undefined;
        })
        .catch((error: unknown) => {
          this.#metadataByCaip19.set(caip19, { status: 'failed' });
          logger.debug('TokenMetadataCoordinator: metadata fetch failed', {
            caip19,
            error: error instanceof Error ? error.message : error,
          });
          this.#onUpdate?.();
        });
    }

    if (args.balanceCaip19) {
      this.#fetchBalance(args.balanceCaip19).catch((error: unknown) => {
        logger.debug(
          'TokenMetadataCoordinator: unexpected balance fetch error',
          {
            caip19: args.balanceCaip19,
            error: error instanceof Error ? error.message : error,
          },
        );
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
   * Returns cached balance for a CAIP-19 asset, if available.
   * @param caip19 - The CAIP-19 asset identifier.
   * @returns Resolved balance or undefined when pending or unavailable.
   */
  getBalance(caip19: CaipAssetType): ResolvedTokenBalance | undefined {
    const entry = this.#balanceByCaip19.get(caip19);
    return entry?.status === 'ready' ? entry.balance : undefined;
  }

  /**
   * Whether a balance lookup has not reached a terminal state.
   * Absent and `pending` entries are treated as in-flight so the UI can
   * render skeletons before `sync()` writes the first map entry.
   * @param caip19 - The CAIP-19 asset identifier.
   * @returns True when the balance is not yet `ready` or `failed`.
   */
  isBalancePending(caip19: CaipAssetType): boolean {
    const entry = this.#balanceByCaip19.get(caip19);
    return entry === undefined || entry.status === 'pending';
  }

  async #fetchMetadata(caip19: CaipAssetType): Promise<ResolvedTokenMetadata> {
    const { chainId, assetAddress } = caip19ToFetchParams(caip19);
    const account = this.#getAccountAddress();

    const { symbol, decimals, iconUrl } =
      await this.#tokenMetadataService.getTokenBalanceAndMetadata({
        chainId,
        account,
        assetAddress: assetAddress ?? ZERO_ADDRESS,
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

  async #fetchBalance(caip19: CaipAssetType): Promise<void> {
    if (!this.#accountCaip10) {
      return;
    }

    const accountCaip10 = this.#accountCaip10;
    this.#balanceByCaip19.set(caip19, { status: 'pending' });

    try {
      const { address } = parseCaipAccountId(accountCaip10);
      const { chainId, assetAddress } = caip19ToFetchParams(caip19);

      const { balance, decimals } =
        await this.#tokenMetadataService.getTokenBalanceAndMetadata({
          chainId,
          account: address as Hex,
          assetAddress: assetAddress ?? ZERO_ADDRESS,
        });

      const formatted = formatUnits({ value: balance, decimals });

      const metadata = this.getMetadata(caip19);
      const metadataDecimals = metadata?.decimals ?? decimals;

      const fiat = await this.#tokenPricesService.getCryptoToFiatConversion(
        caip19,
        bigIntToHex(balance),
        metadataDecimals,
      );

      if (!this.#isSelectedBalance({ accountCaip10, caip19 })) {
        return;
      }

      this.#balanceByCaip19.set(caip19, {
        status: 'ready',
        balance: {
          formatted,
          fiat,
        },
      });
    } catch (error: unknown) {
      if (!this.#isSelectedBalance({ accountCaip10, caip19 })) {
        return;
      }

      this.#balanceByCaip19.set(caip19, { status: 'failed' });
      logger.debug('TokenMetadataCoordinator: balance fetch failed', {
        caip19,
        error: error instanceof Error ? error.message : error,
      });
    }

    if (this.#isSelectedBalance({ accountCaip10, caip19 })) {
      this.#onUpdate?.();
    }
  }

  /**
   * Whether this lookup still matches the selected account and balance token.
   * @param args - Account and token captured when the fetch started.
   * @param args.accountCaip10 - Account used for the in-flight fetch.
   * @param args.caip19 - Token used for the in-flight fetch.
   * @returns True when both still match the latest {@link sync} selection.
   */
  #isSelectedBalance({
    accountCaip10,
    caip19,
  }: {
    accountCaip10: CaipAccountId;
    caip19: CaipAssetType;
  }): boolean {
    return (
      this.#accountCaip10 === accountCaip10 && this.#balanceCaip19 === caip19
    );
  }

  #getAccountAddress(): Hex {
    if (!this.#accountCaip10) {
      throw new InternalError(
        'TokenMetadataCoordinator account not set before metadata fetch',
      );
    }

    const { address } = parseCaipAccountId(this.#accountCaip10);
    return address as Hex;
  }
}
