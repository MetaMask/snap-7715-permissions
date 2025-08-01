import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type { AccountController } from '../accountController';
import { getIconData } from '../permissions/iconUtil';
import type { TokenMetadataService } from '../services/tokenMetadataService';
import type { TokenPricesService } from '../services/tokenPricesService';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../userEventDispatcher';
import { getChainMetadata } from './chainMetadata';
import {
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

  #deregisterHandlers: (() => void) | undefined;

  #hasHandledPermissionRequest = false;

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
      throw new Error('Permission request already handled');
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
      return await this.#dependencies.buildContext({
        permissionRequest: request,
        tokenPricesService: this.#tokenPricesService,
        accountController: this.#accountController,
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

      const { name: networkName } = getChainMetadata({ chainId });

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
      const rerender = async () =>
        await updateContext({ updatedContext: currentContext });

      const showMoreButtonClickHandler: UserEventHandler<
        UserInputEventType.ButtonClickEvent
      > = async () => {
        this.#isJustificationCollapsed = !this.#isJustificationCollapsed;
        await rerender();
      };

      this.#userEventDispatcher.on({
        elementName: JUSTIFICATION_SHOW_MORE_BUTTON_NAME,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: showMoreButtonClickHandler,
      });

      const deregisterRuleHandlers = bindRuleHandlers({
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

      this.#deregisterHandlers = () => {
        deregisterRuleHandlers();
        this.#userEventDispatcher.off({
          elementName: JUSTIFICATION_SHOW_MORE_BUTTON_NAME,
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler: showMoreButtonClickHandler,
        });
      };
    };

    const onConfirmationResolvedHandler = () => {
      this.#deregisterHandlers?.();
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
