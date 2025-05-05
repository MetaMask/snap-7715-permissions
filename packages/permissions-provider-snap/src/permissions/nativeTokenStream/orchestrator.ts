import type { CaveatBuilder } from '@metamask/delegation-toolkit';

import type { AccountController } from '../../accountController';
import type { ConfirmationDialogFactory } from '../../core/confirmationFactory';
import { BaseOrchestrator } from '../../core/baseOrchestrator';
import type {
  StateChangeHandler,
  AdditionalField,
  TimePeriod,
} from '../../core/types';
import type { TokenPricesService } from '../../services/tokenPricesService';
import { IconUrls } from '../../ui/iconConstant';
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

  get title(): string {
    return 'Native token stream';
  }

  get additionalDetailsFields(): AdditionalField[] {
    return [
      {
        label: 'Token',
        value: 'ETH',
        iconUrl: IconUrls.ethereum.token,
      },
    ];
  }

  async createUiContent(args: {
    context: NativeTokenStreamContext;
    metadata: NativeTokenStreamMetadata;
  }) {
    return this.#dependencies.createConfirmationContent(args);
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

  get stateChangeHandlers(): StateChangeHandler<NativeTokenStreamContext>[] {
    return [
      {
        elementName: INITIAL_AMOUNT_ELEMENT,
        contextMapper: (
          context: NativeTokenStreamContext,
          value: string | boolean,
        ) => ({
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            initialAmount: String(value),
          },
        }),
      },
      {
        elementName: MAX_AMOUNT_ELEMENT,
        contextMapper: (
          context: NativeTokenStreamContext,
          value: string | boolean,
        ) => ({
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            maxAmount: String(value),
          },
        }),
      },
      {
        elementName: START_TIME_ELEMENT,
        contextMapper: (
          context: NativeTokenStreamContext,
          value: string | boolean,
        ) => ({
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            startTime: String(value),
          },
        }),
      },
      {
        elementName: EXPIRY_ELEMENT,
        contextMapper: (
          context: NativeTokenStreamContext,
          value: string | boolean,
        ) => ({
          ...context,
          expiry: String(value),
        }),
      },
      {
        elementName: AMOUNT_PER_PERIOD_ELEMENT,
        contextMapper: (
          context: NativeTokenStreamContext,
          value: string | boolean,
        ) => ({
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            amountPerPeriod: String(value),
          },
        }),
      },
      {
        elementName: TIME_PERIOD_ELEMENT,
        contextMapper: (
          context: NativeTokenStreamContext,
          value: string | boolean,
        ) => ({
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
