import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  NO_ASSET_ADDRESS,
  ZERO_ADDRESS,
} from '@metamask/7715-permissions-shared/types';
import { InvalidRequestError, UserInputEventType } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import type { Hex } from '@metamask/utils';
import {
  bigIntToHex,
  isStrictHexString,
  numberToHex,
  parseCaipAccountId,
  parseCaipAssetType,
} from '@metamask/utils';

import {
  ACCOUNT_SELECTOR_NAME,
  ConfirmationShellContent,
  SHOW_EXISTING_PERMISSIONS_BUTTON_NAME,
  SkeletonConfirmationShellContent,
} from './confirmationShellContent';
import { JUSTIFICATION_SHOW_MORE_BUTTON_NAME } from './constants';
import { logger } from '../../../../shared/src/utils/logger';
import type {
  FetchAddressScanResult,
  ScanDappUrlResult,
} from '../../clients/trustSignalsClient';
import { getIconData } from '../../permissions/iconUtil';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import type { TokenPricesService } from '../../services/tokenPricesService';
import type { UserEventDispatcher } from '../../userEventDispatcher';
import { createCancellableOperation } from '../../utils/cancellableOperation';
import type { MessageKey } from '../../utils/i18n';
import { formatUnits } from '../../utils/value';
import type {
  AccountController,
  AccountUpgradeStatus,
} from '../accountController';
import { createCallOnceGuard } from '../callOnceGuard';
import { getChainMetadata } from '../chainMetadata';
import { EXISTING_PERMISSIONS_CONFIRM_BUTTON } from '../existingpermissions';
import type { ExistingPermissionsState } from '../existingpermissions/existingPermissionsState';
import { bindRuleHandlers } from '../rules';
import type { BaseContext, RuleDefinition } from '../types';

export type ConfirmationShellRenderArgs<
  TContext extends BaseContext,
  TMetadata extends object,
> = {
  context: TContext;
  metadata: TMetadata;
  origin: string;
  chainId: number;
  scanDappUrlResult: ScanDappUrlResult | null;
  scanAddressResult: FetchAddressScanResult | null;
  existingPermissionsStatus: ExistingPermissionsState;
  isGrantDisabled: boolean;
};

export type ConfirmationShellBindSessionArgs<
  TContext extends BaseContext,
  TMetadata extends object,
> = {
  interfaceId: string;
  initialContext: TContext;
  rules: RuleDefinition<TContext, TMetadata>[];
  updateContext: (args: { updatedContext: TContext }) => Promise<void>;
  onExistingPermissionsViewChange: (show: boolean) => Promise<void>;
};

export type ConfirmationShellParams<
  TContext extends BaseContext,
  TMetadata extends object,
> = {
  userEventDispatcher: UserEventDispatcher;
  accountController: AccountController;
  tokenMetadataService: TokenMetadataService;
  tokenPricesService: TokenPricesService;
  title: MessageKey;
  subtitle: MessageKey;
  permissionRequest: PermissionRequest;
  showTokenBalance: boolean;
  renderBody: (args: {
    context: TContext;
    metadata: TMetadata;
  }) => Promise<SnapElement>;
};

/**
 * Permission-agnostic confirmation chrome and event wiring for permission requests.
 * One instance per permission request; {@link bindSessionEvents} must only be called once.
 */
export class ConfirmationShell<
  TContext extends BaseContext,
  TMetadata extends object,
> {
  readonly #userEventDispatcher: UserEventDispatcher;

  readonly #accountController: AccountController;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #tokenPricesService: TokenPricesService;

  readonly #permissionTitle: MessageKey;

  readonly #permissionSubtitle: MessageKey;

  readonly #permissionRequest: PermissionRequest;

  readonly #showTokenBalance: boolean;

  readonly #renderBody: ConfirmationShellParams<
    TContext,
    TMetadata
  >['renderBody'];

  #isJustificationCollapsed = true;

  #unbindSessionEvents: (() => void) | null = null;

  #tokenBalance: string | null = null;

  #tokenBalanceFiat: string | null = null;

  #accountUpgradeStatus: AccountUpgradeStatus = { isUpgraded: true };

  readonly #callOnceGuard = createCallOnceGuard(
    'ConfirmationShell.bindSessionEvents()',
  );

  constructor({
    userEventDispatcher,
    accountController,
    tokenMetadataService,
    tokenPricesService,
    title,
    subtitle,
    permissionRequest,
    showTokenBalance,
    renderBody,
  }: ConfirmationShellParams<TContext, TMetadata>) {
    this.#userEventDispatcher = userEventDispatcher;
    this.#accountController = accountController;
    this.#tokenMetadataService = tokenMetadataService;
    this.#tokenPricesService = tokenPricesService;
    this.#permissionTitle = title;
    this.#permissionSubtitle = subtitle;
    this.#permissionRequest = permissionRequest;
    this.#showTokenBalance = showTokenBalance;
    this.#renderBody = renderBody;
  }

  /**
   * Creates skeleton confirmation content while the full context is loading.
   * @returns Skeleton confirmation UI.
   */
  createSkeletonContent(): SnapElement {
    return SkeletonConfirmationShellContent({
      permissionTitle: this.#permissionTitle,
      permissionSubtitle: this.#permissionSubtitle,
    });
  }

  /**
   * Creates full confirmation content with permission-agnostic chrome.
   * @param args - Context, metadata, and orchestrator-provided UI state.
   * @returns Full confirmation UI.
   */
  async createConfirmationContent(
    args: ConfirmationShellRenderArgs<TContext, TMetadata>,
  ): Promise<SnapElement> {
    const {
      context,
      metadata,
      origin,
      chainId,
      scanDappUrlResult,
      scanAddressResult,
      existingPermissionsStatus,
      isGrantDisabled,
    } = args;

    const { name: networkName, explorerUrl } = getChainMetadata({ chainId });

    const tokenIconData = getIconData(context);

    const {
      justification,
      tokenMetadata: { symbol: tokenSymbol },
    } = context;

    const delegateAddress = this.#permissionRequest.to;
    if (!delegateAddress) {
      throw new InvalidRequestError('Delegate address is undefined');
    }

    const permissionContent = await this.#renderBody({
      context,
      metadata,
    });

    return ConfirmationShellContent({
      origin,
      scanDappUrlResult,
      scanAddressResult,
      delegateAddress,
      justification,
      networkName,
      tokenSymbol,
      tokenIconData,
      isJustificationCollapsed: this.#isJustificationCollapsed,
      children: permissionContent,
      permissionTitle: this.#permissionTitle,
      permissionSubtitle: this.#permissionSubtitle,
      context,
      tokenBalance: this.#tokenBalance,
      tokenBalanceFiat: this.#tokenBalanceFiat,
      chainId,
      explorerUrl,
      isAccountUpgraded: this.#accountUpgradeStatus.isUpgraded,
      existingPermissionsStatus,
      isGrantDisabled,
      showTokenBalance: this.#showTokenBalance,
    });
  }

  /**
   * Registers session events for the confirmation dialog.
   * @param args - Session identifiers, rules, and context update callback.
   * @returns Unbind function for the registered handlers.
   * @throws If called more than once on the same instance.
   */
  bindSessionEvents(
    args: ConfirmationShellBindSessionArgs<TContext, TMetadata>,
  ): () => void {
    this.#callOnceGuard();

    const {
      interfaceId,
      initialContext,
      rules,
      updateContext,
      onExistingPermissionsViewChange,
    } = args;

    let currentContext = initialContext;
    const rerender = async (): Promise<void> => {
      await updateContext({ updatedContext: currentContext });
    };

    const fetchAccountBalance = createCancellableOperation<
      TContext,
      { balance: bigint; decimals: number; ctx: TContext }
    >({
      operation: async (ctx) => {
        const { address } = parseCaipAccountId(ctx.accountAddressCaip10);
        const {
          assetReference,
          chain: { reference: chainId },
        } = parseCaipAssetType(ctx.tokenAddressCaip19);

        const assetAddress = isStrictHexString(assetReference)
          ? assetReference
          : ZERO_ADDRESS;

        const { balance, decimals } =
          await this.#tokenMetadataService.getTokenBalanceAndMetadata({
            chainId: parseInt(chainId, 10),
            account: address as Hex,
            assetAddress,
          });

        return { balance, decimals, ctx };
      },
      onSuccess: async ({ balance, decimals, ctx }, isCancelled) => {
        this.#tokenBalance = formatUnits({ value: balance, decimals });
        await rerender();

        // Fetch fiat balance after token balance is set
        const fiatBalance =
          await this.#tokenPricesService.getCryptoToFiatConversion(
            ctx.tokenAddressCaip19,
            bigIntToHex(balance),
            ctx.tokenMetadata.decimals,
          );

        // Check if this operation was cancelled during the fiat balance fetch
        if (isCancelled()) {
          return;
        }

        this.#tokenBalanceFiat = fiatBalance;
        await rerender();
      },
    });

    const fetchAccountUpgradeStatus = createCancellableOperation<
      TContext,
      AccountUpgradeStatus
    >({
      operation: async (ctx) => {
        const {
          address,
          chain: { reference: chainId },
        } = parseCaipAccountId(ctx.accountAddressCaip10);

        return this.#accountController.getAccountUpgradeStatus({
          account: address as Hex,
          chainId: numberToHex(parseInt(chainId, 10)),
        });
      },
      onSuccess: async (status) => {
        this.#accountUpgradeStatus = status;
        await rerender();
      },
    });

    const shouldFetchTokenBalance =
      this.#showTokenBalance &&
      currentContext.tokenAddressCaip19 !== NO_ASSET_ADDRESS;
    if (shouldFetchTokenBalance) {
      fetchAccountBalance(currentContext).catch((error) => {
        const { message } = error as Error;
        logger.error(`Fetching account balance failed: ${message}`);
      });
    }

    // Fetch account upgrade status in the background (don't await)
    fetchAccountUpgradeStatus(currentContext).catch(() => {
      // Silently ignore errors, we don't want to block the permission request if the account upgrade status fetch fails
    });

    const { unbind: unbindShowMoreButtonClick } = this.#userEventDispatcher.on({
      elementName: JUSTIFICATION_SHOW_MORE_BUTTON_NAME,
      eventType: UserInputEventType.ButtonClickEvent,
      interfaceId,
      handler: async () => {
        this.#isJustificationCollapsed = !this.#isJustificationCollapsed;
        await rerender();
      },
    });

    const { unbind: unbindAccountSelected } = this.#userEventDispatcher.on({
      elementName: ACCOUNT_SELECTOR_NAME,
      eventType: UserInputEventType.InputChangeEvent,
      interfaceId,
      handler: async ({ event: { value } }) => {
        const {
          addresses: [address],
        } = value as unknown as {
          addresses: [`${string}:${string}:${string}`];
        };

        currentContext = {
          ...currentContext,
          accountAddressCaip10: address,
        };

        this.#tokenBalance = null;
        this.#tokenBalanceFiat = null;
        this.#accountUpgradeStatus = { isUpgraded: true }; // Reset to default while fetching

        // we explicitly don't await this as it's a background process that will re-render the UI once it is complete
        const shouldFetchTokenBalanceForAccount =
          this.#showTokenBalance &&
          currentContext.tokenAddressCaip19 !== NO_ASSET_ADDRESS;
        if (shouldFetchTokenBalanceForAccount) {
          fetchAccountBalance(currentContext).catch((error) => {
            const { message } = error as Error;
            logger.error(`Fetching account balance failed: ${message}`);
          });
        }

        // Fetch account upgrade status for the new account in the background
        fetchAccountUpgradeStatus(currentContext).catch((error) => {
          const { message } = error as Error;
          logger.error(`Fetching account upgrade status failed: ${message}`);
        });

        await rerender();
      },
    });

    const { unbind: unbindShowExistingPermissionsButtonClick } =
      this.#userEventDispatcher.on({
        elementName: SHOW_EXISTING_PERMISSIONS_BUTTON_NAME,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: async () => {
          await onExistingPermissionsViewChange(true);
        },
      });

    const { unbind: unbindExistingPermissionsConfirmButtonClick } =
      this.#userEventDispatcher.on({
        elementName: EXISTING_PERMISSIONS_CONFIRM_BUTTON,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: async () => {
          await onExistingPermissionsViewChange(false);
        },
      });

    const unbindRuleHandlers = bindRuleHandlers({
      rules,
      userEventDispatcher: this.#userEventDispatcher,
      interfaceId,
      getContext: () => currentContext,
      onContextChanged: async ({ context }) => {
        currentContext = context;
        await rerender();
      },
    });

    const unbind = (): void => {
      unbindRuleHandlers();
      unbindShowMoreButtonClick();
      unbindAccountSelected();
      unbindShowExistingPermissionsButtonClick();
      unbindExistingPermissionsConfirmButtonClick();
    };

    this.#unbindSessionEvents = unbind;

    return unbind;
  }

  /**
   * Unbinds session event handlers when the confirmation is resolved.
   */
  resolveSession(): void {
    this.#unbindSessionEvents?.();
  }
}
