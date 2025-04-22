import type { TokenPricesService } from '../../services/tokenPricesService';
import { BaseOrchestrator, StateChangeHandler } from '../../core/orchestrator';
import type { AccountController } from '../../accountController';
import { parseAndValidatePermission } from './validation';
import { appendCaveats } from './caveats';
import {
  contextToPermissionRequest,
  permissionRequestToContext,
  createContextMetadata,
} from './context';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamPermissionRequest,
  ValidatedNativeTokenStreamPermissionRequest,
  NativeTokenStreamMetadata,
} from './types';
import type { UserEventDispatcher } from '../../userEventDispatcher';
import {
  createConfirmationContent,
  EXPIRY_ELEMENT,
  INITIAL_AMOUNT_ELEMENT,
  MAX_AMOUNT_ELEMENT,
  START_TIME_ELEMENT,
} from './content';
import type { ConfirmationDialogFactory } from '../../core/confirmation/factory';
import { CaveatBuilder } from '@metamask/delegation-toolkit';
import { PermissionResponse } from '@metamask/7715-permissions-shared/types';

/**
 * Orchestrator for native token stream permissions.
 * Coordinates the permission-specific validation, UI, and caveat logic.
 */
export class NativeTokenStreamOrchestrator extends BaseOrchestrator<
  ValidatedNativeTokenStreamPermissionRequest,
  PermissionResponse,
  NativeTokenStreamContext,
  NativeTokenStreamMetadata
> {
  readonly #tokenPricesService: TokenPricesService;

  constructor({
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
  }) {
    const validatedPermissionRequest =
      parseAndValidatePermission(permissionRequest);

    super({
      accountController,
      permissionRequest: validatedPermissionRequest,
      confirmationDialogFactory,
      userEventDispatcher,
    });

    this.#tokenPricesService = tokenPricesService;
  }

  get title(): string {
    return 'Native token stream';
  }

  async createUi(args: {
    context: NativeTokenStreamContext;
    metadata: NativeTokenStreamMetadata;
  }) {
    return createConfirmationContent(args);
  }

  async createContextMetadata(
    context: NativeTokenStreamContext,
  ): Promise<NativeTokenStreamMetadata> {
    return createContextMetadata({
      context,
    });
  }

  async buildPermissionContext(): Promise<NativeTokenStreamContext> {
    return permissionRequestToContext({
      permissionRequest: this.permissionRequest,
      tokenPricesService: this.#tokenPricesService,
      accountController: this.accountController,
    });
  }

  protected async resolvePermissionRequest(
    context: NativeTokenStreamContext,
  ): Promise<ValidatedNativeTokenStreamPermissionRequest> {
    return contextToPermissionRequest({
      permissionRequest: this.permissionRequest,
      context,
    });
  }

  protected async appendCaveats(
    permissionRequest: ValidatedNativeTokenStreamPermissionRequest,
    caveatBuilder: CaveatBuilder,
  ): Promise<CaveatBuilder> {
    return appendCaveats({
      permissionRequest,
      caveatBuilder,
    });
  }

  get stateChangeHandlers(): StateChangeHandler<NativeTokenStreamContext>[] {
    return [
      {
        elementName: INITIAL_AMOUNT_ELEMENT,
        contextMapper: (context, value) => ({
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            initialAmount: value as string,
          },
        }),
      },
      {
        elementName: MAX_AMOUNT_ELEMENT,
        contextMapper: (context, value) => ({
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            maxAmount: value as string,
          },
        }),
      },
      {
        elementName: START_TIME_ELEMENT,
        contextMapper: (context, value) => ({
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            startTime: value as string,
          },
        }),
      },
      {
        elementName: EXPIRY_ELEMENT,
        contextMapper: (context, value) => ({
          ...context,
          expiry: value as string,
        }),
      },
    ];
  }
}
