import type { CaveatBuilder } from '@metamask/delegation-toolkit';
import type { FormSubmitEvent, InputChangeEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type { AccountController } from '../../accountController';
import { BaseOrchestrator } from '../../core/baseOrchestrator';
import type { ConfirmationDialogFactory } from '../../core/confirmationFactory';
import type { StateChangeHandler } from '../../core/types';
import type { TokenPricesService } from '../../services/tokenPricesService';
import type { UserEventDispatcher } from '../../userEventDispatcher';
import { appendCaveats } from './caveats';
import {
  createConfirmationContent,
  TOGGLE_ADD_MORE_RULES_BUTTON,
  JUSTIFICATION_SHOW_MORE_BUTTON_NAME,
  ADD_MORE_RULES_FORM,
  NEW_RULE_VALUE_ELEMENT,
  SELECT_NEW_RULE_DROPDOWN,
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
  CompleteNativeTokenStreamPermission,
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

  #addNewRuleSelectedIndex = 0;

  #addNewRuleValue: string | undefined;

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

  async getRuleValidationMessage({
    context,
    metadata,
  }: {
    context: NativeTokenStreamContext;
    metadata: NativeTokenStreamMetadata;
  }) {
    const rule = metadata.rulesToAdd[this.#addNewRuleSelectedIndex];

    if (rule !== undefined) {
      if (rule === 'Initial amount') {
        const updatedContext = {
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            initialAmount: this.#addNewRuleValue,
          },
        };

        const updatedMetadata =
          await this.createContextMetadata(updatedContext);

        return updatedMetadata.validationErrors.initialAmountError;
      } else if (rule === 'Max amount') {
        const updatedContext = {
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            maxAmount: this.#addNewRuleValue,
          },
        };

        const updatedMetadata =
          await this.createContextMetadata(updatedContext);

        return updatedMetadata.validationErrors.maxAmountError;
      }
      throw new Error(`Unknown rule: ${rule}`);
    }

    return undefined;
  }

  async createUiContent(args: {
    context: NativeTokenStreamContext;
    metadata: NativeTokenStreamMetadata;
    origin: string;
    chainId: number;
  }) {
    const addRuleValidationMessage = await this.getRuleValidationMessage({
      context: args.context,
      metadata: args.metadata,
    });

    return this.#dependencies.createConfirmationContent({
      ...args,
      isJustificationCollapsed: this.#isJustificationCollapsed,
      isAddRuleShown: this.#isAddRuleShown,
      addRuleValidationMessage,
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
  }): Promise<CompleteNativeTokenStreamPermission> {
    return this.#dependencies.hydratePermission(args);
  }

  protected async appendCaveats(
    permission: CompleteNativeTokenStreamPermission,
    caveatBuilder: CaveatBuilder,
  ): Promise<CaveatBuilder> {
    return this.#dependencies.appendCaveats({
      permission,
      caveatBuilder,
    });
  }

  get stateChangeHandlers(): StateChangeHandler<
    NativeTokenStreamContext,
    NativeTokenStreamMetadata
  >[] {
    // Plain handlers that directly access class instance variables
    const justificationShowMoreHandler: StateChangeHandler<
      NativeTokenStreamContext,
      UserInputEventType.ButtonClickEvent
    > = {
      eventType: UserInputEventType.ButtonClickEvent,
      elementName: JUSTIFICATION_SHOW_MORE_BUTTON_NAME,
      contextMapper: ({ context }: { context: NativeTokenStreamContext }) => {
        this.#isJustificationCollapsed = !this.#isJustificationCollapsed;
        return context;
      },
    };

    // todo: these are all related to add-new-rules features. This should be
    // abstracted out of the orchestrator and into a Rules component

    const selectNewRuleHandler: StateChangeHandler<
      NativeTokenStreamContext,
      NativeTokenStreamMetadata,
      UserInputEventType.InputChangeEvent
    > = {
      eventType: UserInputEventType.InputChangeEvent,
      elementName: SELECT_NEW_RULE_DROPDOWN,
      contextMapper: ({
        context,
        event,
      }: {
        context: NativeTokenStreamContext;
        event: InputChangeEvent;
      }) => {
        this.#addNewRuleSelectedIndex = parseInt(event.value as string, 10);
        return context;
      },
    };

    const addNewRuleValueHandler: StateChangeHandler<
      NativeTokenStreamContext,
      NativeTokenStreamMetadata,
      UserInputEventType.InputChangeEvent
    > = {
      eventType: UserInputEventType.InputChangeEvent,
      elementName: NEW_RULE_VALUE_ELEMENT,
      contextMapper: ({
        context,
        event,
      }: {
        context: NativeTokenStreamContext;
        event: InputChangeEvent;
      }) => {
        this.#addNewRuleValue = event.value as string;

        return context;
      },
    };

    const toggleAddMoreRulesHandler: StateChangeHandler<
      NativeTokenStreamContext,
      NativeTokenStreamMetadata,
      UserInputEventType.ButtonClickEvent
    > = {
      eventType: UserInputEventType.ButtonClickEvent,
      elementName: TOGGLE_ADD_MORE_RULES_BUTTON,
      contextMapper: ({ context }: { context: NativeTokenStreamContext }) => {
        this.#addNewRuleSelectedIndex = 0;
        this.#isAddRuleShown = !this.#isAddRuleShown;
        return context;
      },
    };

    const addMoreRulesFormHandler: StateChangeHandler<
      NativeTokenStreamContext,
      NativeTokenStreamMetadata,
      UserInputEventType.FormSubmitEvent
    > = {
      eventType: UserInputEventType.FormSubmitEvent,
      elementName: ADD_MORE_RULES_FORM,
      contextMapper: ({
        context,
        event,
        metadata,
      }: {
        context: NativeTokenStreamContext;
        event: FormSubmitEvent;
        metadata: NativeTokenStreamMetadata;
      }) => {
        const permissionDetails = { ...context.permissionDetails };

        const ruleIndex = parseInt(
          event.value[SELECT_NEW_RULE_DROPDOWN] as string,
          10,
        );
        const value = event.value[NEW_RULE_VALUE_ELEMENT] as string;

        const rule = metadata.rulesToAdd[ruleIndex];

        if (rule === 'Initial amount') {
          permissionDetails.initialAmount = value;
        } else if (rule === 'Max amount') {
          permissionDetails.maxAmount = value;
        } else {
          throw new Error(`Unknown form field: ${rule ?? 'undefined'}`);
        }

        this.#isAddRuleShown = false;

        return { ...context, permissionDetails };
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
      selectNewRuleHandler,
      addNewRuleValueHandler,
    ] as StateChangeHandler<
      NativeTokenStreamContext,
      NativeTokenStreamMetadata
    >[];
  }
}
