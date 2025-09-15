import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  InvalidRequestError,
  ResourceNotFoundError,
  UserInputEventType,
} from '@metamask/snaps-sdk';
import type { Hex } from '@metamask/utils';
import {
  bigIntToHex,
  isStrictHexString,
  parseCaipAccountId,
  parseCaipAssetType,
} from '@metamask/utils';

import { getIconData } from '../permissions/iconUtil';
import type { TokenMetadataService } from '../services/tokenMetadataService';
import type { TokenPricesService } from '../services/tokenPricesService';
import type { UserEventDispatcher } from '../userEventDispatcher';
import type { AccountController } from './accountController';
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
import { ZERO_ADDRESS } from '../constants';
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

  readonly #permissionTitle: string;

  #isJustificationCollapsed = true;

  #unbindHandlers: (() => void) | null = null;

  #hasHandledPermissionRequest = false;

  #tokenBalance: string | null = null;

  #tokenBalanceFiat: string | null = null;

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
    const buildContextHandler = async (request: TRequest) => {
      const requestedAddressLowercase = request.address?.toLowerCase() as
        | Hex
        | undefined;

      const allAvailableAddresses =
        await this.#accountController.getAccountAddresses();

      let address: Hex;

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
        address = request.address as Hex;
      } else {
        // use the first address available for the account
        address = allAvailableAddresses[0];
      }

      return await this.#dependencies.buildContext({
        permissionRequest: { ...request, address },
        tokenMetadataService: this.#tokenMetadataService,
      });
    };

    const createSkeletonConfirmationContentHandler = async () => {
      return SkeletonPermissionHandlerContent({
        permissionTitle: this.#permissionTitle,
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
    }) => {
      const permissionContent =
        await this.#dependencies.createConfirmationContent({
          context,
          metadata,
        });

      const { name: networkName, explorerUrl } = getChainMetadata({ chainId });

      const tokenIconData = getIconData(context);

      const {
        justification,
        tokenMetadata: { symbol: tokenSymbol },
      } = context;

      return PermissionHandlerContent({
        origin,
        justification,
        networkName,
        tokenSymbol,
        tokenIconData,
        isJustificationCollapsed: this.#isJustificationCollapsed,
        children: permissionContent,
        permissionTitle: this.#permissionTitle,
        context,
        tokenBalance: this.#tokenBalance,
        tokenBalanceFiat: this.#tokenBalanceFiat,
        chainId,
        explorerUrl,
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
    }) => {
      let currentContext = initialContext;
      const rerender = async () => {
        await updateContext({ updatedContext: currentContext });
      };

      // fetchAccountBalanceCallCounter is used to cancel any previously executed instances of this function.
      let fetchAccountBalanceCallCounter = 0;
      const fetchAccountBalance = async (context: TContext) => {
        fetchAccountBalanceCallCounter += 1;
        const currentCallCounter = fetchAccountBalanceCallCounter;

        const { address } = parseCaipAccountId(context.accountAddressCaip10);

        const {
          assetReference,
          chain: { reference: chainId },
        } = parseCaipAssetType(context.tokenAddressCaip19);

        const assetAddress = isStrictHexString(assetReference)
          ? assetReference
          : ZERO_ADDRESS;

        const { balance, decimals } =
          await this.#tokenMetadataService.getTokenBalanceAndMetadata({
            chainId: parseInt(chainId, 10),
            account: address as Hex,
            assetAddress,
          });

        if (currentCallCounter !== fetchAccountBalanceCallCounter) {
          // the function was called again, abandon the current call.
          return;
        }

        this.#tokenBalance = formatUnits({ value: balance, decimals });

        // send the request to fetch the fiat balance, then re-render the UI while we wait for the response
        const fiatBalanceRequest =
          this.#tokenPricesService.getCryptoToFiatConversion(
            context.tokenAddressCaip19,
            bigIntToHex(balance),
            context.tokenMetadata.decimals,
          );

        await rerender();

        const fiatBalance = await fiatBalanceRequest;

        if (currentCallCounter !== fetchAccountBalanceCallCounter) {
          // the function was called again, abandon the current call.
          return;
        }

        this.#tokenBalanceFiat = fiatBalance;

        await rerender();
      };

      // we explicitly don't await this as it's a background process that will re-render the UI (twice) once it is complete
      fetchAccountBalance(currentContext).catch((error) => {
        const { message } = error as Error;
        logger.error(`Fetching account balance failed: ${message}`);
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

          // we explicitly don't await this as it's a background process that will re-render the UI once it is complete
          fetchAccountBalance(currentContext).catch((error) => {
            const { message } = error as Error;
            logger.error(`Fetching account balance failed: ${message}`);
          });

          await rerender();
        },
      });

      const unbindRuleHandlers = bindRuleHandlers({
        rules: this.#rules,
        userEventDispatcher: this.#userEventDispatcher,
        interfaceId,
        getContext: () => currentContext,
        deriveMetadata: this.#dependencies.deriveMetadata,
        onContextChanged: async ({ context }) => {
          currentContext = context;
          await rerender();
        },
      });

      this.#unbindHandlers = () => {
        unbindRuleHandlers();
        unbindShowMoreButtonClick();
        unbindAccountSelected();
      };
    };

    const onConfirmationResolvedHandler = () => {
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
