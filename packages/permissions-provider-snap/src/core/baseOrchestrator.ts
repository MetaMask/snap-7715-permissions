import type {
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { CaveatBuilder } from '@metamask/delegation-toolkit';
import {
  createCaveatBuilder,
  createDelegation,
  encodeDelegation,
} from '@metamask/delegation-toolkit';
import type { UserInputEventType } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { toHex, type Hex } from 'viem';

import type { AccountController, FactoryArgs } from '../accountController';
import type {
  UserEventDispatcher,
  UserEventHandler,
  UserInputEventByType,
} from '../userEventDispatcher';
import type { ConfirmationDialogFactory } from './confirmationFactory';
import type {
  BaseContext,
  DeepRequired,
  StateChangeHandler,
  Orchestrator,
} from './types';

const bindStateChangeHandlers = <
  TContext extends BaseContext,
  TMetadata extends object,
>({
  stateChangeHandlers,
  onContextChanged,
  getContext,
  getMetadata,
  interfaceId,
  userEventDispatcher,
}: {
  stateChangeHandlers: StateChangeHandler<TContext, TMetadata>[];
  onContextChanged: (context: TContext) => void | Promise<void>;
  getContext: () => TContext | undefined;
  getMetadata: () => Promise<TMetadata>;
  interfaceId: string;
  userEventDispatcher: UserEventDispatcher;
}) => {
  const handlerUnbinders = stateChangeHandlers.map((stateChangeHandler) => {
    const handler: UserEventHandler<UserInputEventType> = async ({
      event,
    }: {
      event: UserInputEventByType<UserInputEventType>;
    }) => {
      let context = getContext();
      const metadata = await getMetadata();
      if (!context) {
        throw new Error('Current context is undefined');
      }

      if (!metadata) {
        throw new Error('Current metadata is undefined');
      }

      context = stateChangeHandler.contextMapper({ context, metadata, event });
      await onContextChanged(context);
    };

    const eventMetadata = {
      eventType: stateChangeHandler.eventType,
      interfaceId,
      elementName: stateChangeHandler.elementName,
      handler,
    } as const;

    userEventDispatcher.on(eventMetadata);

    return () => {
      userEventDispatcher.off(eventMetadata);
    };
  });

  return () => {
    handlerUnbinders.forEach((unbinder) => unbinder());
  };
};

/**
 * Base class for permission orchestrators that handle the core flow of permission requests.
 * Subclasses must implement specific methods to handle UI, validation, and permission context.
 */
export abstract class BaseOrchestrator<
  TPermissionRequest extends PermissionRequest = PermissionRequest,
  TContext extends BaseContext = BaseContext,
  TMetadata extends object = object,
  THydratedPermission extends DeepRequired<
    TPermissionRequest['permission']
  > = DeepRequired<TPermissionRequest['permission']>,
> implements Orchestrator
{
  protected readonly accountController: AccountController;

  protected readonly confirmationDialogFactory: ConfirmationDialogFactory;

  protected readonly accountDataPromise: Promise<
    [address: Hex, metadata: FactoryArgs, delegationManager: Hex]
  >;

  protected readonly userEventDispatcher: UserEventDispatcher;

  #currentContext: TContext | undefined;

  readonly #permissionRequest: TPermissionRequest;

  constructor({
    accountController,
    permissionRequest,
    confirmationDialogFactory,
    userEventDispatcher,
  }: {
    accountController: AccountController;
    permissionRequest: TPermissionRequest;
    confirmationDialogFactory: ConfirmationDialogFactory;
    userEventDispatcher: UserEventDispatcher;
  }) {
    this.accountController = accountController;
    this.confirmationDialogFactory = confirmationDialogFactory;
    this.userEventDispatcher = userEventDispatcher;

    this.#permissionRequest = permissionRequest;

    const chainId = Number(permissionRequest.chainId);

    this.accountDataPromise = Promise.all([
      this.accountController.getAccountAddress({
        chainId,
      }),
      this.accountController.getAccountMetadata({
        chainId,
      }),
      this.accountController.getDelegationManager({
        chainId,
      }),
    ]);
  }

  /**
   * The state change handlers for the permission request.
   */
  protected abstract get stateChangeHandlers(): StateChangeHandler<
    TContext,
    TMetadata
  >[];

  /**
   * Build the permission context from the permission request..
   */
  protected abstract buildPermissionContext(args: {
    permissionRequest: TPermissionRequest;
  }): Promise<TContext>;

  /**
   * Create the derived metadata for the permission context.
   */
  protected abstract createContextMetadata(
    context: TContext,
  ): Promise<TMetadata>;

  /**
   * Resolve the permission request, applying the state from the provided context.
   */
  protected abstract resolvePermissionRequest(args: {
    context: TContext;
    originalRequest: TPermissionRequest;
  }): Promise<TPermissionRequest>;

  /**
   * Create the UI content for the permission confirmation.
   */
  protected abstract createUiContent(args: {
    context: TContext;
    metadata: TMetadata;
    origin: string;
    chainId: number;
  }): Promise<GenericSnapElement>;

  /**
   * Hydrate the permission, resolving any default values.
   */
  protected abstract hydratePermission(args: {
    permission: TPermissionRequest['permission'];
  }): Promise<THydratedPermission>;

  /**
   * Append permission-specific caveats to the caveat builder.
   */
  protected abstract appendCaveats(
    permissionRequest: THydratedPermission,
    caveatBuilder: CaveatBuilder,
  ): Promise<CaveatBuilder>;

  /**
   * Main orchestration method that coordinates the permission request flow.
   * @param options0 - The options object containing orchestration parameters.
   * @param options0.origin - The origin of the permission request.
   * @returns A promise that resolves to an object containing the success status, optional response, and optional failure reason.
   */
  async orchestrate({ origin }: { origin: string }): Promise<{
    success: boolean;
    response?: PermissionResponse;
    reason?: string;
  }> {
    this.#currentContext = await this.buildPermissionContext({
      permissionRequest: this.#permissionRequest,
    });

    const chainId = Number(this.#permissionRequest.chainId);

    const confirmationDialog =
      this.confirmationDialogFactory.createConfirmation({
        ui: await this.createUiContent({
          context: this.#currentContext,
          metadata: await this.createContextMetadata(this.#currentContext),
          origin,
          chainId,
        }),
      });

    const interfaceId = await confirmationDialog.createInterface();

    const onContextChanged = async (context: TContext) => {
      this.#currentContext = context;
      const metadata = await this.createContextMetadata(this.#currentContext);

      await confirmationDialog.updateContent({
        ui: await this.createUiContent({
          context: this.#currentContext,
          metadata,
          origin,
          chainId,
        }),
      });
    };

    const unbindStateChangeHandlers = bindStateChangeHandlers({
      stateChangeHandlers: this.stateChangeHandlers,
      onContextChanged,
      getContext: () => this.#currentContext,
      getMetadata: async () => {
        if (this.#currentContext === undefined) {
          throw new Error('Current context is undefined');
        }
        return this.createContextMetadata(this.#currentContext);
      },
      interfaceId,
      userEventDispatcher: this.userEventDispatcher,
    });

    const { isConfirmationGranted } =
      await confirmationDialog.awaitUserDecision();

    unbindStateChangeHandlers();

    if (!isConfirmationGranted) {
      return {
        success: false,
        reason: 'User rejected the permissions request',
      };
    }

    const isAdjustmentAllowed =
      this.#permissionRequest.isAdjustmentAllowed ?? true;
    const resolvedPermissionRequest = isAdjustmentAllowed
      ? await this.resolvePermissionRequest({
          context: this.#currentContext,
          originalRequest: this.#permissionRequest,
        })
      : this.#permissionRequest;

    const grantedPermission = await this.hydratePermission({
      permission: resolvedPermissionRequest.permission,
    });

    const grantedPermissionRequest = {
      ...resolvedPermissionRequest,
      permission: grantedPermission,
      isAdjustmentAllowed,
    };

    const [address, accountMeta, delegationManager] =
      await this.accountDataPromise;

    const environment = await this.accountController.getEnvironment({
      chainId,
    });

    const caveatBuilder = createCaveatBuilder(environment).addCaveat(
      'timestamp',
      0, // timestampAfter
      grantedPermissionRequest.expiry, // timestampBefore
    );

    const appendedCaveatBuilder = await this.appendCaveats(
      grantedPermission,
      caveatBuilder,
    );

    const signedDelegation = await this.accountController.signDelegation({
      chainId,
      delegation: createDelegation({
        to: this.#permissionRequest.signer.data.address,
        from: address,
        caveats: appendedCaveatBuilder,
      }),
    });

    const permissionsContext = encodeDelegation([signedDelegation]);

    const accountMetaObj =
      accountMeta.factory && accountMeta.factoryData
        ? {
            factory: accountMeta.factory,
            factoryData: accountMeta.factoryData,
          }
        : {};

    const response: PermissionResponse = {
      ...grantedPermissionRequest,
      chainId: toHex(chainId),
      address,
      isAdjustmentAllowed,
      context: permissionsContext,
      ...accountMetaObj,
      signerMeta: {
        delegationManager,
      },
    };

    return {
      success: true,
      response,
    };
  }
}
