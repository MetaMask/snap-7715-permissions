import type {
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import { getChainName } from '@metamask/7715-permissions-shared/utils';
import type { CaveatBuilder } from '@metamask/delegation-toolkit';
import {
  createCaveatBuilder,
  createDelegation,
  encodeDelegation,
} from '@metamask/delegation-toolkit';
import { type InputChangeEvent, UserInputEventType } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { toHex, type Hex } from 'viem';

import type { AccountController, FactoryArgs } from '../accountController';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../userEventDispatcher';
import type { ConfirmationDialogFactory } from './confirmationFactory';
import type {
  BaseContext,
  DeepRequired,
  AdditionalField,
  StateChangeHandler,
  Orchestrator,
} from './types';

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
   * The title of the permission.
   */
  protected abstract get title(): string;

  /**
   * The state change handlers for the permission request.
   */
  protected abstract get stateChangeHandlers(): StateChangeHandler<TContext>[];

  /**
   * Additional fields to display in the confirmation dialog.
   */
  protected abstract get additionalDetailsFields(): AdditionalField[];

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
    const chainName = getChainName(chainId);

    const confirmationDialog =
      this.confirmationDialogFactory.createConfirmation({
        title: this.title,
        justification: this.#permissionRequest.permission.data.justification,
        origin,
        network: chainName,
        additionalFields: this.additionalDetailsFields,
        ui: await this.createUiContent({
          context: this.#currentContext,
          metadata: await this.createContextMetadata(this.#currentContext),
        }),
      });

    const interfaceId = await confirmationDialog.createInterface();

    const handlerUnbinders = this.stateChangeHandlers.map(
      (stateChangeHandler) => {
        const handler: UserEventHandler<
          UserInputEventType.InputChangeEvent
        > = async ({ event }: { event: InputChangeEvent }) => {
          if (!this.#currentContext) {
            throw new Error('Current context is undefined');
          }

          const value = stateChangeHandler.valueMapper
            ? stateChangeHandler.valueMapper(event)
            : (event.value as string);

          this.#currentContext = stateChangeHandler.contextMapper(
            this.#currentContext,
            value,
          );

          confirmationDialog.updateContent({
            ui: await this.createUiContent({
              context: this.#currentContext,
              metadata: await this.createContextMetadata(this.#currentContext),
            }),
          });
        };

        const eventMetadata = {
          eventType: UserInputEventType.InputChangeEvent,
          interfaceId,
          elementName: stateChangeHandler.elementName,
          handler,
        } as const;

        this.userEventDispatcher.on(eventMetadata);

        return () => {
          this.userEventDispatcher.off(eventMetadata);
        };
      },
    );

    const { isConfirmationGranted } =
      await confirmationDialog.awaitUserDecision();

    // unbind handlers
    handlerUnbinders.forEach((unbinder) => unbinder());

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

    const permissionsContext = await encodeDelegation([signedDelegation]);

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
