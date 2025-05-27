import type { CaveatBuilder } from '@metamask/delegation-toolkit';
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
  PopulatedNativeTokenStreamPermission,
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
  populatePermission: typeof populatePermission;
  appendCaveats: typeof appendCaveats;
};

const defaultDependencies: NativeTokenStreamDependencies = {
  parseAndValidatePermission,
  createConfirmationContent,
  contextToPermissionRequest,
  permissionRequestToContext,
  createContextMetadata,
  populatePermission,
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
      rules: allRules,
    });

    this.#tokenPricesService = tokenPricesService;
    this.#dependencies = dependencies;
  }

  async createUiContent(args: {
    context: NativeTokenStreamContext;
    metadata: NativeTokenStreamMetadata;
    origin: string;
    chainId: number;
    showAddMoreRulesButton: boolean;
  }) {
    return this.#dependencies.createConfirmationContent({
      ...args,
      isJustificationCollapsed: this.#isJustificationCollapsed,
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

  protected async populatePermission(args: {
    permission: NativeTokenStreamPermission;
  }): Promise<PopulatedNativeTokenStreamPermission> {
    return this.#dependencies.populatePermission(args);
  }

  protected async appendCaveats(
    permission: PopulatedNativeTokenStreamPermission,
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
    // not really a state change handler - infact we can remove this concept entirely
    const justificationShowMoreHandler: StateChangeHandler<
      NativeTokenStreamContext,
      NativeTokenStreamMetadata
    > = {
      eventType: UserInputEventType.ButtonClickEvent,
      elementName: JUSTIFICATION_SHOW_MORE_BUTTON_NAME,
      contextMapper: ({ context }: { context: NativeTokenStreamContext }) => {
        this.#isJustificationCollapsed = !this.#isJustificationCollapsed;
        return context;
      },
    };

    return [justificationShowMoreHandler];
  }
}
