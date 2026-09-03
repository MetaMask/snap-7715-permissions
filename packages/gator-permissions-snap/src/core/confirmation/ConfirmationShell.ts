import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { InvalidRequestError, UserInputEventType } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import type { Hex } from '@metamask/utils';
import {
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
import type { ConfirmationTokenBalance } from './confirmationShellContent';
import { JUSTIFICATION_SHOW_MORE_BUTTON_NAME } from './constants';
import { logger } from '../../../../shared/src/utils/logger';
import type {
  FetchAddressScanResult,
  ScanDappUrlResult,
} from '../../clients/trustSignalsClient';
import { getIconData } from '../../permissions/iconUtil';
import type { UserEventDispatcher } from '../../userEventDispatcher';
import type { MessageKey } from '../../utils/i18n';
import type {
  AccountController,
  AccountUpgradeStatus,
} from '../accountController';
import { createCallOnceGuard } from '../callOnceGuard';
import { getChainMetadata } from '../chainMetadata';
import type { TokenMetadataCoordinator } from '../coordinators/TokenMetadataCoordinator';
import { EXISTING_PERMISSIONS_CONFIRM_BUTTON } from '../existingpermissions';
import type { ExistingPermissionsState } from '../existingpermissions/existingPermissionsState';
import { bindRuleHandlers } from '../rules';
import { resolveModuleTokenCaip19s } from '../token/tokenSelectors';
import type {
  BaseContext,
  RuleDefinition,
  ShellTokenDisplay,
  TokenCaip19Selector,
} from '../types';

const PENDING_TOKEN_BALANCE: ConfirmationTokenBalance = {
  formatted: null,
  fiat: null,
};

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
  syncCoordinator: (context: TContext) => void;
};

export type ConfirmationShellParams<
  TContext extends BaseContext,
  TMetadata extends object,
> = {
  userEventDispatcher: UserEventDispatcher;
  accountController: AccountController;
  title: MessageKey;
  subtitle: MessageKey;
  permissionRequest: PermissionRequest;
  tokenCaip19s: TokenCaip19Selector<TContext>[];
  balanceTokenCaip19?: TokenCaip19Selector<TContext> | undefined;
  tokenMetadataCoordinator: TokenMetadataCoordinator;
  renderBody: (args: {
    context: TContext;
    metadata: TMetadata;
    tokenMetadata: TokenMetadataCoordinator;
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

  readonly #tokenMetadataCoordinator: TokenMetadataCoordinator;

  readonly #permissionTitle: MessageKey;

  readonly #permissionSubtitle: MessageKey;

  readonly #permissionRequest: PermissionRequest;

  readonly #tokenCaip19s: TokenCaip19Selector<TContext>[];

  readonly #balanceTokenCaip19: TokenCaip19Selector<TContext> | undefined;

  readonly #renderBody: ConfirmationShellParams<
    TContext,
    TMetadata
  >['renderBody'];

  #isJustificationCollapsed = true;

  #unbindSessionEvents: (() => void) | null = null;

  #accountUpgradeStatus: AccountUpgradeStatus = { isUpgraded: true };

  readonly #callOnceGuard = createCallOnceGuard(
    'ConfirmationShell.bindSessionEvents()',
  );

  constructor({
    userEventDispatcher,
    accountController,
    title,
    subtitle,
    permissionRequest,
    tokenCaip19s,
    balanceTokenCaip19,
    tokenMetadataCoordinator,
    renderBody,
  }: ConfirmationShellParams<TContext, TMetadata>) {
    this.#userEventDispatcher = userEventDispatcher;
    this.#accountController = accountController;
    this.#permissionTitle = title;
    this.#permissionSubtitle = subtitle;
    this.#permissionRequest = permissionRequest;
    this.#tokenCaip19s = tokenCaip19s;
    this.#balanceTokenCaip19 = balanceTokenCaip19;
    this.#tokenMetadataCoordinator = tokenMetadataCoordinator;
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
   * Builds shell token display props from resolved CAIP-19s.
   * @param tokenCaip19s - Token CAIP-19s to display as TokenField rows.
   * @param explorerUrl - Block explorer base URL.
   * @returns Token display data for shell TokenField components.
   */
  #buildShellTokens(
    tokenCaip19s: CaipAssetType[],
    explorerUrl: string | undefined,
  ): ShellTokenDisplay[] {
    return tokenCaip19s.map((caip19) => {
      const metadata = this.#tokenMetadataCoordinator.getMetadata(caip19);
      const { assetReference, assetNamespace } = parseCaipAssetType(caip19);

      let tokenAddress: string | undefined;
      let tokenExplorerUrl: string | undefined;

      if (assetNamespace === 'erc20' && explorerUrl) {
        tokenAddress = assetReference;
        tokenExplorerUrl = `${explorerUrl}/address/${assetReference}`;
      }

      return {
        caip19,
        symbol: metadata?.symbol ?? '',
        tokenAddress,
        explorerUrl: tokenExplorerUrl,
        iconData: getIconData(this.#tokenMetadataCoordinator, caip19),
      };
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

    const { justification } = context;

    const delegateAddress = this.#permissionRequest.to;
    if (!delegateAddress) {
      throw new InvalidRequestError('Delegate address is undefined');
    }

    const { tokenCaip19s, balanceCaip19 } = resolveModuleTokenCaip19s({
      context,
      tokenCaip19s: this.#tokenCaip19s,
      balanceTokenCaip19: this.#balanceTokenCaip19,
    });
    let tokenBalance: ConfirmationTokenBalance | undefined;
    if (balanceCaip19) {
      tokenBalance =
        this.#tokenMetadataCoordinator.getBalance(balanceCaip19) ??
        (this.#tokenMetadataCoordinator.isBalancePending(balanceCaip19)
          ? PENDING_TOKEN_BALANCE
          : undefined);
    }

    const permissionContent = await this.#renderBody({
      context,
      metadata,
      tokenMetadata: this.#tokenMetadataCoordinator,
    });

    return ConfirmationShellContent({
      origin,
      scanDappUrlResult,
      scanAddressResult,
      delegateAddress,
      justification,
      networkName,
      shellTokens: this.#buildShellTokens(tokenCaip19s, explorerUrl),
      isJustificationCollapsed: this.#isJustificationCollapsed,
      children: permissionContent,
      permissionTitle: this.#permissionTitle,
      permissionSubtitle: this.#permissionSubtitle,
      context,
      tokenBalance,
      chainId,
      isAccountUpgraded: this.#accountUpgradeStatus.isUpgraded,
      existingPermissionsStatus,
      isGrantDisabled,
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
      syncCoordinator,
    } = args;

    let currentContext = initialContext;
    const rerender = async (): Promise<void> => {
      await updateContext({ updatedContext: currentContext });
    };

    const fetchAccountUpgradeStatus = async (ctx: TContext): Promise<void> => {
      try {
        const {
          address,
          chain: { reference: chainId },
        } = parseCaipAccountId(ctx.accountAddressCaip10);

        this.#accountUpgradeStatus =
          await this.#accountController.getAccountUpgradeStatus({
            account: address as Hex,
            chainId: numberToHex(parseInt(chainId, 10)),
          });
        await rerender();
      } catch (error) {
        const { message } = error as Error;
        logger.error(`Fetching account upgrade status failed: ${message}`);
      }
    };

    this.#tokenMetadataCoordinator.onUpdate(() => {
      rerender().catch((error) => {
        const { message } = error as Error;
        logger.error(`Token metadata coordinator update failed: ${message}`);
      });
    });

    syncCoordinator(currentContext);
    fetchAccountUpgradeStatus(currentContext).catch(() => undefined);

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

        this.#accountUpgradeStatus = { isUpgraded: true };

        syncCoordinator(currentContext);
        fetchAccountUpgradeStatus(currentContext).catch(() => undefined);

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
