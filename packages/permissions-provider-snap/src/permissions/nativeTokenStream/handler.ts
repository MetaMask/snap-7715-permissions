import type { AccountController } from '../../accountController';
import { PermissionRequestLifecycleOrchestrator } from '../../core/permissionRequestLifecycleOrchestrator';
import type { LifecycleOrchestrationHandlers } from '../../core/types';
import type { PermissionHandler } from '../types';
import type { TokenPricesService } from '../../services/tokenPricesService';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../../userEventDispatcher';
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
import type {
  NativeTokenStreamContext,
  NativeTokenStreamPermissionRequest,
  NativeTokenStreamMetadata,
  NativeTokenStreamPermission,
  PopulatedNativeTokenStreamPermission,
} from './types';
import { parseAndValidatePermission } from './validation';
import { bindRuleHandlers } from '../rules';
import { allRules } from './rules';
import type { PermissionRequestResult } from '../../core/types';
import { UserInputEventType } from '@metamask/snaps-sdk';

// Update dependencies to match LifecycleOrchestrationHandlers
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
  createConfirmationContent: createConfirmationContent,
  applyContext: contextToPermissionRequest,
  populatePermission: populatePermission,
  appendCaveats: appendCaveats,
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

  #isJustificationCollapsed = true;
  #isAddRuleShown = false;
  #addNewRuleSelectedIndex = 0;
  #addNewRuleValue: string | undefined;

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
   * @param origin - The request origin
   * @param permissionRequest - The permission request
   * @returns The permission response
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
   */
  #getLifecycleHandlers(): LifecycleOrchestrationHandlers<
    NativeTokenStreamPermissionRequest,
    NativeTokenStreamContext,
    NativeTokenStreamMetadata,
    NativeTokenStreamPermission,
    PopulatedNativeTokenStreamPermission
  > {
    const {
      validateRequest,
      applyContext,
      populatePermission,
      appendCaveats,
      deriveMetadata,
    } = this.#dependencies;

    const buildContext = async (
      request: NativeTokenStreamPermissionRequest,
    ) => {
      return this.#dependencies.buildContext({
        permissionRequest: request,
        tokenPricesService: this.#tokenPricesService,
        accountController: this.#accountController,
      });
    };

    const createConfirmationContent = async (args: {
      context: NativeTokenStreamContext;
      metadata: NativeTokenStreamMetadata;
      origin: string;
      chainId: number;
    }) => {
      return this.#dependencies.createConfirmationContent({
        ...args,
        isJustificationCollapsed: this.#isJustificationCollapsed,
        isAddRuleShown: this.#isAddRuleShown,
        addRuleValidationMessage: '',
      });
    };

    const onConfirmationCreated = ({
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

      const showMoreButtonClickHandler: UserEventHandler<
        UserInputEventType.ButtonClickEvent
      > = () => {
        this.#isJustificationCollapsed = !this.#isJustificationCollapsed;
        updateContext({ updatedContext: currentContext });
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
        onContextChange: (context) => {
          currentContext = context;
          updateContext({ updatedContext: currentContext });
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

    const onConfirmationResolved = () => {
      this.#deregisterHandlers?.();
    };

    return {
      validateRequest,
      applyContext,
      populatePermission,
      appendCaveats,
      deriveMetadata,
      buildContext,
      createConfirmationContent,
      onConfirmationCreated,
      onConfirmationResolved,
    };
  }
}
