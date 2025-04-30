import {
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import {
  CaveatBuilder,
  createCaveatBuilder,
  createDelegation,
  encodeDelegation,
} from '@metamask/delegation-toolkit';

import type { AccountController, FactoryArgs } from '../accountController';
import { ConfirmationDialogFactory } from './confirmation/factory';

import { BaseContext, HydratedPermissionRequest } from './types';
import { extractChain, Hex } from 'viem';
import {
  UserEventDispatcher,
  UserEventHandler,
  type UserInputEventByType,
} from '../userEventDispatcher';
import { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { InputChangeEvent, UserInputEventType } from '@metamask/snaps-sdk';
import { sepolia } from 'viem/chains';

export type StateChangeHandler<TContext> = {
  elementName: string;
  valueMapper?: (
    event: UserInputEventByType<UserInputEventType.InputChangeEvent>,
  ) => string | boolean;
  contextMapper: (context: TContext, value: string | boolean) => TContext;
};

/**
 * Base class for permission orchestrators that handle the core flow of permission requests.
 * Subclasses must implement specific methods to handle UI, validation, and permission context.
 */
export abstract class BaseOrchestrator<
  TPermissionRequest extends PermissionRequest = PermissionRequest,
  TPermissionResponse extends PermissionResponse = PermissionResponse,
  TContext extends BaseContext = BaseContext,
  TMetadata extends object = {},
  THydratedPermissionRequest extends
    HydratedPermissionRequest<TPermissionRequest> = HydratedPermissionRequest<TPermissionRequest>,
> {
  protected readonly accountController: AccountController;
  protected readonly permissionRequest: TPermissionRequest;
  protected readonly confirmationDialogFactory: ConfirmationDialogFactory;
  protected readonly accountDataPromise: Promise<
    [address: Hex, metadata: FactoryArgs, delegationManager: Hex]
  >;
  protected readonly userEventDispatcher: UserEventDispatcher;

  #currentContext: TContext | undefined;

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
    this.permissionRequest = permissionRequest;
    this.confirmationDialogFactory = confirmationDialogFactory;
    this.userEventDispatcher = userEventDispatcher;

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

  protected abstract get title(): string;

  protected abstract get token(): string;

  protected abstract get stateChangeHandlers(): StateChangeHandler<TContext>[];

  protected abstract createUi(args: {
    context: TContext;
    metadata: TMetadata;
  }): Promise<GenericSnapElement>;

  protected abstract createContextMetadata(
    context: TContext,
  ): Promise<TMetadata>;

  protected abstract buildPermissionContext(): Promise<TContext>;

  /**
   * Resolve the permission request based on the granted context.
   */
  protected abstract resolvePermissionRequest(args: {
    context: TContext;
    originalRequest: TPermissionRequest;
  }): Promise<TPermissionRequest>;

  /**
   * Resolve any optional properties of the permission request.
   */
  protected abstract hydratePermissionRequest(args: {
    permissionRequest: TPermissionRequest;
  }): Promise<THydratedPermissionRequest>;

  /**
   * Append permission-specific caveats to the caveat builder.
   * Subclasses must implement this to add their specific caveats.
   */
  protected abstract appendCaveats(
    permissionRequest: THydratedPermissionRequest,
    caveatBuilder: CaveatBuilder,
  ): Promise<CaveatBuilder>;

  /**
   * Main orchestration method that coordinates the permission request flow.
   * This method should not be overridden by subclasses.
   */
  async orchestrate({ origin }: { origin: string }): Promise<{
    success: boolean;
    response?: TPermissionResponse;
    reason?: string;
  }> {
    this.#currentContext = await this.buildPermissionContext();

    const metadata = await this.createContextMetadata(this.#currentContext);

    const chain = extractChain({
      chains: [sepolia],
      id: Number(this.permissionRequest.chainId) as any,
    });

    if (!chain) {
      throw new Error('Chain not found');
    }

    const confirmationDialog =
      this.confirmationDialogFactory.createConfirmation({
        title: this.title,
        justification: this.permissionRequest.permission.data.justification,
        origin: origin,
        network: chain.name,
        token: this.token,
        ui: await this.createUi({
          context: this.#currentContext,
          metadata,
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

          const metadata = await this.createContextMetadata(
            this.#currentContext,
          );

          confirmationDialog.updateContent({
            ui: await this.createUi({
              context: this.#currentContext,
              metadata,
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

    const resolvedPermissionRequest =
      (this.permissionRequest.isAdjustmentAllowed ?? true)
        ? await this.resolvePermissionRequest({
            context: this.#currentContext,
            originalRequest: this.permissionRequest,
          })
        : this.permissionRequest;

    const grantedPermissionRequest = await this.hydratePermissionRequest({
      permissionRequest: resolvedPermissionRequest,
    });

    const [address, accountMeta, delegationManager] =
      await this.accountDataPromise;

    const chainId = Number(grantedPermissionRequest.chainId);

    const environment = await this.accountController.getEnvironment({
      chainId,
    });

    const caveatBuilder = createCaveatBuilder(environment).addCaveat(
      'timestamp',
      0, // timestampAfter
      grantedPermissionRequest.expiry, // timestampBefore
    );

    const appendedCaveatBuilder = await this.appendCaveats(
      grantedPermissionRequest,
      caveatBuilder,
    );

    const signedDelegation = await this.accountController.signDelegation({
      chainId,
      delegation: createDelegation({
        to: this.permissionRequest.signer.data.address,
        from: address,
        caveats: appendedCaveatBuilder,
      }),
    });

    const permissionsContext = await encodeDelegation([signedDelegation]);

    const hasAccountMeta = accountMeta.factory && accountMeta.factoryData;

    return {
      success: true,
      response: {
        chainId,
        address,
        expiry: grantedPermissionRequest.expiry,
        isAdjustmentAllowed: grantedPermissionRequest.isAdjustmentAllowed,
        signer: {
          type: 'account',
          data: {
            address: this.permissionRequest.signer.data.address,
          },
        },
        permission: grantedPermissionRequest.permission,
        context: permissionsContext,
        ...(hasAccountMeta ? { accountMeta } : {}),
        signerMeta: {
          delegationManager,
        },
      } as unknown as TPermissionResponse, // todo: fix this
    };
  }
}
