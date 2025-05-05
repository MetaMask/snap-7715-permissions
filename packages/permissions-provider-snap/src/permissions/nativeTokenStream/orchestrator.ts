import type { CaveatBuilder } from '@metamask/delegation-toolkit';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type { AccountController } from '../../accountController';
import type { ConfirmationDialogFactory } from '../../core/confirmationFactory';
import { BaseOrchestrator } from '../../core/baseOrchestrator';
import type { StateChangeHandler } from '../../core/types';
import type { TokenPricesService } from '../../services/tokenPricesService';
import type { UserEventDispatcher } from '../../userEventDispatcher';
import { appendCaveats } from './caveats';
import {
  createConfirmationContent,
  TOGGLE_ADD_MORE_RULES_BUTTON,
  JUSTIFICATION_SHOW_MORE_BUTTON_NAME,
  ADD_MORE_RULES_FORM,
} from './content';
import {
  contextToPermissionRequest,
  permissionRequestToContext,
  createContextMetadata,
  hydratePermission,
} from './context';
import {
  initialAmountHandler,
  removeInitialAmountHandler,
  maxAmountHandler,
  removeMaxAmountHandler,
  startTimeHandler,
  expiryHandler,
  amountPerPeriodHandler,
  timePeriodHandler,
} from './stateChangeHandlers';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamPermissionRequest,
  HydratedNativeTokenStreamPermission,
  NativeTokenStreamMetadata,
  NativeTokenStreamPermission,
} from './types';
import { parseAndValidatePermission } from './validation';

export type NativeTokenStreamDependencies = {
  parseAndValidatePermission: typeof parseAndValidatePermission;
  createConfirmationContent: typeof createConfirmationContent;
  contextToPermissionRequest: typeof contextToPermissionRequest;
  permissionRequestToContext: typeof permissionRequestToContext;
  createContextMetadata: typeof createContextMetadata;
  hydratePermission: typeof hydratePermission;
  appendCaveats: typeof appendCaveats;
};

const defaultDependencies: NativeTokenStreamDependencies = {
  parseAndValidatePermission,
  createConfirmationContent,
  contextToPermissionRequest,
  permissionRequestToContext,
  createContextMetadata,
  hydratePermission,
  appendCaveats,
};

/**
 * Orchestrator for native token stream permissions.
 * Coordinates the permission-specific validation, UI, and caveat logic.
 */
export class NativeTokenStreamOrchestrator extends BaseOrchestrator<
  NativeTokenStreamPermissionRequest,
  NativeTokenStreamContext,
  NativeTokenStreamMetadata
> {
  readonly #tokenPricesService: TokenPricesService;
  readonly #dependencies: NativeTokenStreamDependencies;
  #isJustificationCollapsed = true;
  #isAddRuleShown = false;

  constructor(
    {
      permissionRequest,
      accountController,
      tokenPricesService,
      confirmationDialogFactory,
      userEventDispatcher,
    }: {
      permissionRequest: NativeTokenStreamPermissionRequest;
      accountController: AccountController;
      tokenPricesService: TokenPricesService;
      confirmationDialogFactory: ConfirmationDialogFactory;
      userEventDispatcher: UserEventDispatcher;
    },
    dependencies: NativeTokenStreamDependencies = defaultDependencies,
  ) {
    const validatedPermissionRequest =
      dependencies.parseAndValidatePermission(permissionRequest);

    super({
      accountController,
      permissionRequest: validatedPermissionRequest,
      confirmationDialogFactory,
      userEventDispatcher,
    });

    this.#tokenPricesService = tokenPricesService;
    this.#dependencies = dependencies;
  }

  async createUiContent(args: {
    context: NativeTokenStreamContext;
    metadata: NativeTokenStreamMetadata;
    origin: string;
    chainId: number;
  }) {
    return this.#dependencies.createConfirmationContent({
      ...args,
      isJustificationCollapsed: this.#isJustificationCollapsed,
      isAddRuleShown: this.#isAddRuleShown,
    });
  }

  async createContextMetadata(
    context: NativeTokenStreamContext,
  ): Promise<NativeTokenStreamMetadata> {
    return this.#dependencies.createContextMetadata({
      context,
    });
  }

  async buildPermissionContext({
    permissionRequest,
  }: {
    permissionRequest: NativeTokenStreamPermissionRequest;
  }): Promise<NativeTokenStreamContext> {
    return this.#dependencies.permissionRequestToContext({
      permissionRequest,
      tokenPricesService: this.#tokenPricesService,
      accountController: this.accountController,
    });
  }

  protected async resolvePermissionRequest(args: {
    context: NativeTokenStreamContext;
    originalRequest: NativeTokenStreamPermissionRequest;
  }): Promise<NativeTokenStreamPermissionRequest> {
    return this.#dependencies.contextToPermissionRequest(args);
  }

  protected async hydratePermission(args: {
    permission: NativeTokenStreamPermission;
  }): Promise<HydratedNativeTokenStreamPermission> {
    return this.#dependencies.hydratePermission(args);
  }

  protected async appendCaveats(
    permission: HydratedNativeTokenStreamPermission,
    caveatBuilder: CaveatBuilder,
  ): Promise<CaveatBuilder> {
    return this.#dependencies.appendCaveats({
      permission,
      caveatBuilder,
    });
  }

  get stateChangeHandlers(): StateChangeHandler<
    NativeTokenStreamContext,
    UserInputEventType
  >[] {
    // Plain handlers that directly access class instance variables
    const justificationShowMoreHandler: StateChangeHandler<
      NativeTokenStreamContext,
      UserInputEventType.ButtonClickEvent
    > = {
      eventType: UserInputEventType.ButtonClickEvent,
      elementName: JUSTIFICATION_SHOW_MORE_BUTTON_NAME,
      contextMapper: (context: NativeTokenStreamContext) => {
        this.#isJustificationCollapsed = !this.#isJustificationCollapsed;
        return context;
      },
    };

    const toggleAddMoreRulesHandler: StateChangeHandler<
      NativeTokenStreamContext,
      UserInputEventType.ButtonClickEvent
    > = {
      eventType: UserInputEventType.ButtonClickEvent,
      elementName: TOGGLE_ADD_MORE_RULES_BUTTON,
      contextMapper: (context: NativeTokenStreamContext) => {
        this.#isAddRuleShown = !this.#isAddRuleShown;
        return context;
      },
    };

    const addMoreRulesFormHandler: StateChangeHandler<
      NativeTokenStreamContext,
      UserInputEventType.FormSubmitEvent
    > = {
      eventType: UserInputEventType.FormSubmitEvent,
      elementName: ADD_MORE_RULES_FORM,
      contextMapper: (context: NativeTokenStreamContext) => {
        this.#isAddRuleShown = false;
        return context;
      },
    };

    // This type assertion is necessary because we need to allow different event types
    // in the array, but StateChangeHandler requires a specific event type.
    return [
      initialAmountHandler,
      removeInitialAmountHandler,
      maxAmountHandler,
      removeMaxAmountHandler,
      startTimeHandler,
      expiryHandler,
      amountPerPeriodHandler,
      timePeriodHandler,
      justificationShowMoreHandler,
      toggleAddMoreRulesHandler,
      addMoreRulesFormHandler,
    ] as StateChangeHandler<NativeTokenStreamContext, UserInputEventType>[];
  }
}
