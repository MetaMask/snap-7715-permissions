import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  NO_ASSET_ADDRESS,
  ZERO_ADDRESS,
} from '@metamask/7715-permissions-shared/types';
import {
  InvalidRequestError,
  ResourceNotFoundError,
  UserInputEventType,
} from '@metamask/snaps-sdk';
import type { Hex } from '@metamask/utils';
import {
  bigIntToHex,
  isStrictHexString,
  numberToHex,
  parseCaipAccountId,
  parseCaipAssetType,
} from '@metamask/utils';

import { getIconData } from '../permissions/iconUtil';
import type { TokenMetadataService } from '../services/tokenMetadataService';
import type { TokenPricesService } from '../services/tokenPricesService';
import type { UserEventDispatcher } from '../userEventDispatcher';
import type {
  AccountController,
  AccountUpgradeStatus,
} from './accountController';
import { getChainMetadata } from './chainMetadata';
import {
  ACCOUNT_SELECTOR_NAME,
  PermissionHandlerContent,
  SkeletonPermissionHandlerContent,
} from './permissionHandlerContent';
import type { PermissionRequestLifecycleOrchestrator } from './permissionRequestLifecycleOrchestrator';
import { bindRuleHandlers } from './rules';
import type {
  BaseContext,
  DeepRequired,
  LifecycleOrchestrationHandlers,
  PermissionRequestResult,
  RuleDefinition,
  PermissionHandlerType,
  PermissionHandlerDependencies,
  PermissionHandlerParams,
} from './types';
import { logger } from '../../../shared/src/utils/logger';
import { createCancellableOperation } from '../utils/cancellableOperation';
import type { MessageKey } from '../utils/i18n';
import { formatUnits } from '../utils/value';

export const JUSTIFICATION_SHOW_MORE_BUTTON_NAME = 'show-more-justification';

/**
 * Handler for permission requests.
 * Coordinates the permission-specific validation, UI, and caveat logic.
 */
export class PermissionHandler<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends object,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
> implements PermissionHandlerType
{
  readonly #accountController: AccountController;

  readonly #userEventDispatcher: UserEventDispatcher;

  readonly #orchestrator: PermissionRequestLifecycleOrchestrator;

  readonly #permissionRequest: PermissionRequest;

  readonly #dependencies: PermissionHandlerDependencies<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  >;

  readonly #tokenPricesService: TokenPricesService;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #rules: RuleDefinition<TContext, TMetadata>[];

  readonly #permissionTitle: MessageKey;

  readonly #permissionSubtitle: MessageKey;

  #isJustificationCollapsed = true;

  #unbindHandlers: (() => void) | null = null;

  #hasHandledPermissionRequest = false;

  #tokenBalance: string | null = null;

  #tokenBalanceFiat: string | null = null;

  #accountUpgradeStatus: AccountUpgradeStatus = { isUpgraded: true };

  constructor({
    accountController,
    userEventDispatcher,
    orchestrator,
    permissionRequest,
    dependencies,
    tokenPricesService,
    tokenMetadataService,
    rules,
    title,
    subtitle,
  }: PermissionHandlerParams<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  >) {
    this.#accountController = accountController;
    this.#userEventDispatcher = userEventDispatcher;
    this.#orchestrator = orchestrator;
    this.#permissionRequest = permissionRequest;
    this.#dependencies = dependencies;
    this.#tokenPricesService = tokenPricesService;
    this.#tokenMetadataService = tokenMetadataService;
    this.#rules = rules;
    this.#permissionTitle = title;
    this.#permissionSubtitle = subtitle;
  }

  /**
   * Orchestrates the token stream permission request.
   * @param origin - The request origin.
   * @returns The permission response.
   */
  async handlePermissionRequest(
    origin: string,
  ): Promise<PermissionRequestResult> {
    if (this.#hasHandledPermissionRequest) {
      throw new InvalidRequestError('Permission request already handled');
    }

    this.#hasHandledPermissionRequest = true;

    const result = await this.#orchestrator.orchestrate(
      origin,
      this.#permissionRequest,
      this.#getLifecycleHandlers(),
    );

    return result;
  }

  /**
   * Returns the lifecycle handlers for the orchestrator.
   * @returns The lifecycle handlers.
   */
  #getLifecycleHandlers(): LifecycleOrchestrationHandlers<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  > {
    const buildContextHandler = async (
      request: TRequest,
    ): Promise<TContext> => {
      const requestedAddressLowercase = request.from?.toLowerCase() as
        | Hex
        | undefined;

      const allAvailableAddresses =
        await this.#accountController.getAccountAddresses();

      let from: Hex;

      if (requestedAddressLowercase) {
        // validate that the requested address is one of the addresses available for the account
        if (
          !allAvailableAddresses.some(
            (availableAddress) =>
              availableAddress.toLowerCase() === requestedAddressLowercase,
          )
        ) {
          throw new ResourceNotFoundError('Requested address not found');
        }
        from = request.from as Hex;
      } else {
        // use the first address available for the account
        from = allAvailableAddresses[0];
      }

      return await this.#dependencies.buildContext({
        permissionRequest: { ...request, from },
        tokenMetadataService: this.#tokenMetadataService,
      });
    };

    const createSkeletonConfirmationContentHandler =
      async (): Promise<JSX.Element> => {
        return SkeletonPermissionHandlerContent({
          permissionTitle: this.#permissionTitle,
          permissionSubtitle: this.#permissionSubtitle,
        });
      };

    const createConfirmationContentHandler = async ({
      context,
      metadata,
      origin,
      chainId,
    }: {
      context: TContext;
      metadata: TMetadata;
      origin: string;
      chainId: number;
    }): Promise<JSX.Element> => {
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

      const permissionContent =
        await this.#dependencies.createConfirmationContent({
          context,
          metadata,
        });

      return PermissionHandlerContent({
        origin,
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
      });
    };

    const onConfirmationCreatedHandler = ({
      interfaceId,
      initialContext,
      updateContext,
    }: {
      interfaceId: string;
      initialContext: TContext;
      updateContext: (args: { updatedContext: TContext }) => Promise<void>;
    }): void => {
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

      // Fetch account balance in the background (don't await)
      // todo: presently the permissionHandler has a presumption that the
      // permission is related to a token from which a balance can be derived.
      // this is not necessarily true, and this presumption must be removed. as
      // a workaround, we check whether there's a token address associated with
      // the context.
      const hasAsset = currentContext.tokenAddressCaip19 !== NO_ASSET_ADDRESS;
      if (hasAsset) {
        fetchAccountBalance(currentContext).catch((error) => {
          const { message } = error as Error;
          logger.error(`Fetching account balance failed: ${message}`);
        });
      }

      // Fetch account upgrade status in the background (don't await)
      fetchAccountUpgradeStatus(currentContext).catch(() => {
        // Silently ignore errors, we don't want to block the permission request if the account upgrade status fetch fails
      });

      const { unbind: unbindShowMoreButtonClick } =
        this.#userEventDispatcher.on({
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
          const hasAssetForAccount =
            currentContext.tokenAddressCaip19 !== NO_ASSET_ADDRESS;
          if (hasAssetForAccount) {
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

      const unbindRuleHandlers = bindRuleHandlers({
        rules: this.#rules,
        userEventDispatcher: this.#userEventDispatcher,
        interfaceId,
        getContext: () => currentContext,
        onContextChanged: async ({ context }) => {
          currentContext = context;
          await rerender();
        },
      });

      this.#unbindHandlers = (): void => {
        unbindRuleHandlers();
        unbindShowMoreButtonClick();
        unbindAccountSelected();
      };
    };

    const onConfirmationResolvedHandler = (): void => {
      this.#unbindHandlers?.();
    };

    const {
      parseAndValidatePermission,
      applyContext,
      populatePermission,
      createPermissionCaveats,
      deriveMetadata,
    } = this.#dependencies;

    return {
      parseAndValidatePermission,
      applyContext,
      populatePermission,
      createPermissionCaveats,
      deriveMetadata,
      buildContext: buildContextHandler,
      createConfirmationContent: createConfirmationContentHandler,
      createSkeletonConfirmationContent:
        createSkeletonConfirmationContentHandler,
      onConfirmationCreated: onConfirmationCreatedHandler,
      onConfirmationResolved: onConfirmationResolvedHandler,
    };
  }
}
