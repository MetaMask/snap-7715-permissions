import type { CaveatBuilder } from '@metamask/delegation-toolkit';

import type { AccountController } from '../../accountController';
import type { ConfirmationDialogFactory } from '../../core/confirmation/factory';
import type { StateChangeHandler } from '../../core/orchestrator';
import { BaseOrchestrator } from '../../core/orchestrator';
import type { AdditionalField, TimePeriod } from '../../core/types';
import type { TokenPricesService } from '../../services/tokenPricesService';
import type { UserEventDispatcher } from '../../userEventDispatcher';
import { appendCaveats } from './caveats';
import {
  AMOUNT_PER_PERIOD_ELEMENT,
  createConfirmationContent,
  EXPIRY_ELEMENT,
  INITIAL_AMOUNT_ELEMENT,
  MAX_AMOUNT_ELEMENT,
  START_TIME_ELEMENT,
  TIME_PERIOD_ELEMENT,
} from './content';
import {
  contextToPermissionRequest,
  permissionRequestToContext,
  createContextMetadata,
  hydratePermission,
} from './context';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamPermissionRequest,
  HydratedNativeTokenStreamPermission,
  NativeTokenStreamMetadata,
  NativeTokenStreamPermission,
} from './types';
import { parseAndValidatePermission } from './validation';

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

  get additionalFields(): AdditionalField[] {
    return [{ label: 'Token', value: 'ETH' }];
  }

  async createUiContent(args: {
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

  async buildPermissionContext({
    permissionRequest,
  }: {
    permissionRequest: NativeTokenStreamPermissionRequest;
  }): Promise<NativeTokenStreamContext> {
    return permissionRequestToContext({
      permissionRequest,
      tokenPricesService: this.#tokenPricesService,
      accountController: this.accountController,
    });
  }

  protected async resolvePermissionRequest(args: {
    context: NativeTokenStreamContext;
    originalRequest: NativeTokenStreamPermissionRequest;
  }): Promise<NativeTokenStreamPermissionRequest> {
    return contextToPermissionRequest(args);
  }

  protected async hydratePermission(args: {
    permission: NativeTokenStreamPermission;
  }): Promise<HydratedNativeTokenStreamPermission> {
    return hydratePermission(args);
  }

  protected async appendCaveats(
    permission: HydratedNativeTokenStreamPermission,
    caveatBuilder: CaveatBuilder,
  ): Promise<CaveatBuilder> {
    return appendCaveats({
      permission,
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
      {
        elementName: AMOUNT_PER_PERIOD_ELEMENT,
        contextMapper: (context, value) => ({
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            amountPerPeriod: value as string,
          },
        }),
      },
      {
        elementName: TIME_PERIOD_ELEMENT,
        contextMapper: (context, value) => ({
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            timePeriod: value as TimePeriod,
          },
        }),
      },
    ];
  }
}
