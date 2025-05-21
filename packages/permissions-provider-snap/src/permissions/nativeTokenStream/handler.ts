import { UserInputEventType } from '@metamask/snaps-sdk';

import type { AccountController } from '../../accountController';
import type { PermissionRequestLifecycleOrchestrator } from '../../core/permissionRequestLifecycleOrchestrator';
import type {
  LifecycleOrchestrationHandlers,
  PermissionRequestResult,
} from '../../core/types';
import type { TokenPricesService } from '../../services/tokenPricesService';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../../userEventDispatcher';
import { RuleModalManager } from '../ruleModalManager';
import { bindRuleHandlers } from '../rules';
import type { PermissionHandler } from '../types';
import { appendCaveats } from './caveats';
import {
  createConfirmationContent,
  JUSTIFICATION_SHOW_MORE_BUTTON_NAME,
} from './content';
import {
  contextToPermissionRequest,
  permissionRequestToContext,
  createContextMetadata,
  populatePermission,
} from './context';
import { allRules } from './rules';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamPermissionRequest,
  NativeTokenStreamMetadata,
  NativeTokenStreamPermission,
  PopulatedNativeTokenStreamPermission,
} from './types';
import { parseAndValidatePermission } from './validation';

export type NativeTokenStreamDependencies = {
  validateRequest: typeof parseAndValidatePermission;
  buildContext: typeof permissionRequestToContext;
  deriveMetadata: typeof createContextMetadata;
  createConfirmationContent: typeof createConfirmationContent;
  applyContext: typeof contextToPermissionRequest;
  populatePermission: typeof populatePermission;
  appendCaveats: typeof appendCaveats;
};

const defaultDependencies: NativeTokenStreamDependencies = {
  validateRequest: parseAndValidatePermission,
  buildContext: permissionRequestToContext,
  deriveMetadata: createContextMetadata,
  createConfirmationContent,
  applyContext: contextToPermissionRequest,
  populatePermission,
  appendCaveats,
};

/**
 * Handler for native token stream permissions.
 * Coordinates the permission-specific validation, UI, and caveat logic.
 */
export class NativeTokenStreamHandler implements PermissionHandler {
  readonly #tokenPricesService: TokenPricesService;

  readonly #accountController: AccountController;

  readonly #userEventDispatcher: UserEventDispatcher;

  readonly #dependencies: NativeTokenStreamDependencies;

  readonly #orchestrator: PermissionRequestLifecycleOrchestrator;

  readonly #permissionRequest: NativeTokenStreamPermissionRequest;

  #addMoreRulesModal:
    | RuleModalManager<NativeTokenStreamContext, NativeTokenStreamMetadata>
    | undefined;

  #isJustificationCollapsed = true;

  #deregisterHandlers: (() => void) | undefined;

  #hasHandledPermissionRequest = false;

  constructor(
    {
      accountController,
      tokenPricesService,
      userEventDispatcher,
      orchestrator,
      permissionRequest,
    }: {
      accountController: AccountController;
      tokenPricesService: TokenPricesService;
      userEventDispatcher: UserEventDispatcher;
      orchestrator: PermissionRequestLifecycleOrchestrator;
      permissionRequest: NativeTokenStreamPermissionRequest;
    },
    dependencies: NativeTokenStreamDependencies = defaultDependencies,
  ) {
    this.#accountController = accountController;
    this.#tokenPricesService = tokenPricesService;
    this.#userEventDispatcher = userEventDispatcher;
    this.#dependencies = dependencies;
    this.#orchestrator = orchestrator;
    this.#permissionRequest = permissionRequest;
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
    NativeTokenStreamPermissionRequest,
    NativeTokenStreamContext,
    NativeTokenStreamMetadata,
    NativeTokenStreamPermission,
    PopulatedNativeTokenStreamPermission
  > {
    const buildContextHandler = async (
      request: NativeTokenStreamPermissionRequest,
    ) => {
      return this.#dependencies.buildContext({
        permissionRequest: request,
        tokenPricesService: this.#tokenPricesService,
        accountController: this.#accountController,
      });
    };

    const createConfirmationContentHandler = async (args: {
      context: NativeTokenStreamContext;
      metadata: NativeTokenStreamMetadata;
      origin: string;
      chainId: number;
    }) => {
      if (this.#addMoreRulesModal?.isModalVisible()) {
        return await this.#addMoreRulesModal.renderModal();
      }

      const showAddMoreRulesButton =
        this.#addMoreRulesModal?.hasRulesToAdd({
          context: args.context,
        }) ?? false;

      return this.#dependencies.createConfirmationContent({
        ...args,
        isJustificationCollapsed: this.#isJustificationCollapsed,
        showAddMoreRulesButton,
      });
    };

    const onConfirmationCreatedHandler = ({
      interfaceId,
      initialContext,
      updateContext,
    }: {
      interfaceId: string;
      initialContext: NativeTokenStreamContext;
      updateContext: (args: {
        updatedContext: NativeTokenStreamContext;
      }) => Promise<void>;
    }) => {
      let currentContext = initialContext;
      const rerender = async () =>
        await updateContext({ updatedContext: currentContext });

      this.#addMoreRulesModal = new RuleModalManager({
        userEventDispatcher: this.#userEventDispatcher,
        interfaceId,
        rules: allRules,
        onModalChange: rerender,
        getContext: () => currentContext,
        deriveMetadata: this.#dependencies.deriveMetadata,
        onContextChange: async ({ context }) => {
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
        rules: allRules,
        userEventDispatcher: this.#userEventDispatcher,
        interfaceId,
        getContext: () => currentContext,
        onContextChange: async ({ context }) => {
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

    return {
      validateRequest: this.#dependencies.validateRequest,
      applyContext: this.#dependencies.applyContext,
      populatePermission: this.#dependencies.populatePermission,
      appendCaveats: this.#dependencies.appendCaveats,
      deriveMetadata: this.#dependencies.deriveMetadata,
      buildContext: buildContextHandler,
      createConfirmationContent: createConfirmationContentHandler,
      onConfirmationCreated: onConfirmationCreatedHandler,
      onConfirmationResolved: onConfirmationResolvedHandler,
    };
  }
}
