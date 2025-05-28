import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { UserInputEventType } from '@metamask/snaps-sdk';
import { type GenericSnapElement } from '@metamask/snaps-sdk/jsx';

import type { AccountController } from '../accountController';
import type { TokenPricesService } from '../services/tokenPricesService';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../userEventDispatcher';
import { PermissionHandlerContent } from './permissionHandlerContent';
import type { PermissionRequestLifecycleOrchestrator } from './permissionRequestLifecycleOrchestrator';
import { RuleModalManager } from './ruleModalManager';
import { bindRuleHandlers } from './rules';
import type {
  BaseContext,
  DeepRequired,
  LifecycleOrchestrationHandlers,
  PermissionRequestResult,
  RuleDefinition,
  PermissionHandlerType,
} from './types';

export const JUSTIFICATION_SHOW_MORE_BUTTON_NAME = 'show-more-justification';

export type PermissionHandlerDependencies<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends object,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
> = {
  validateRequest: (permissionRequest: TRequest) => TRequest;
  buildContext: (args: {
    permissionRequest: TRequest;
    tokenPricesService: any;
    accountController: AccountController;
  }) => Promise<TContext>;
  deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;
  createConfirmationContent: (args: {
    context: TContext;
    metadata: TMetadata;
    origin: string;
    chainId: number;
    isJustificationCollapsed: boolean;
    showAddMoreRulesButton: boolean;
  }) => Promise<GenericSnapElement>;
  applyContext: (args: {
    context: TContext;
    originalRequest: TRequest;
  }) => Promise<TRequest>;
  populatePermission: (args: {
    permission: TPermission;
  }) => Promise<TPopulatedPermission>;
  appendCaveats: (args: {
    permission: TPopulatedPermission;
    caveatBuilder: any;
  }) => Promise<any>;
};

export type PermissionHandlerParams<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends object,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
> = {
  accountController: AccountController;
  userEventDispatcher: UserEventDispatcher;
  orchestrator: PermissionRequestLifecycleOrchestrator;
  permissionRequest: TRequest;
  dependencies: PermissionHandlerDependencies<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  >;
  tokenPricesService: any;
  rules: RuleDefinition<TContext, TMetadata>[];
  title: string;
};

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

  readonly #permissionRequest: TRequest;

  readonly #dependencies: PermissionHandlerDependencies<
    TRequest,
    TContext,
    TMetadata,
    TPermission,
    TPopulatedPermission
  >;

  readonly #tokenPricesService: TokenPricesService;

  readonly #rules: RuleDefinition<TContext, TMetadata>[];

  readonly #permissionTitle: string;

  #addMoreRulesModal: RuleModalManager<TContext, TMetadata> | undefined;

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
      });
    };

    const createConfirmationContentHandler = async (args: {
      context: TContext;
      metadata: TMetadata;
      origin: string;
      chainId: number;
    }) => {
      if (this.#addMoreRulesModal?.isModalVisible()) {
        return await this.#addMoreRulesModal.renderModal();
      }

      const showAddMoreRulesButton =
        (await this.#addMoreRulesModal?.hasRulesToAdd({
          context: args.context,
        })) ?? false;

      const permissionContent =
        await this.#dependencies.createConfirmationContent({
          ...args,
          isJustificationCollapsed: this.#isJustificationCollapsed,
          showAddMoreRulesButton,
        });

      return PermissionHandlerContent({
        showAddMoreRulesButton,
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

      this.#addMoreRulesModal = new RuleModalManager({
        userEventDispatcher: this.#userEventDispatcher,
        interfaceId,
        rules: this.#rules,
        onModalChanged: rerender,
        getContext: () => currentContext,
        deriveMetadata: this.#dependencies.deriveMetadata,
        onContextChanged: async ({ context }) => {
          currentContext = context;
          await rerender();
        },
      });

      this.#addMoreRulesModal.bindHandlers();

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
      this.#addMoreRulesModal?.unbindHandlers();
    };

    const {
      validateRequest,
      applyContext,
      populatePermission,
      appendCaveats,
      deriveMetadata,
    } = this.#dependencies;

    return {
      validateRequest,
      applyContext,
      populatePermission,
      appendCaveats,
      deriveMetadata,
      buildContext: buildContextHandler,
      createConfirmationContent: createConfirmationContentHandler,
      onConfirmationCreated: onConfirmationCreatedHandler,
      onConfirmationResolved: onConfirmationResolvedHandler,
    };
  }
}
