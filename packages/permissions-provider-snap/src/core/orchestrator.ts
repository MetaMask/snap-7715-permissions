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

import { BaseContext } from './types';
import { Hex } from 'viem';
import {
  UserEventDispatcher,
  UserEventHandler,
  type UserInputEventByType,
} from '../userEventDispatcher';
import { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { InputChangeEvent, UserInputEventType } from '@metamask/snaps-sdk';

// todo make this actually a validated permission request
type ValidatedPermissionRequest = PermissionRequest & {
  isAdjustmentAllowed: boolean;
};

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
  TPermissionRequest extends
    ValidatedPermissionRequest = ValidatedPermissionRequest,
  TPermissionResponse extends PermissionResponse = PermissionResponse,
  TContext extends BaseContext = BaseContext,
> {
  protected readonly accountController: AccountController;
  protected readonly permissionRequest: TPermissionRequest;
  protected readonly confirmationDialogFactory: ConfirmationDialogFactory;
  protected readonly accountDataPromise: Promise<
    [address: Hex, metadata: FactoryArgs, delegationManager: Hex]
  >;
  protected readonly userEventDispatcher: UserEventDispatcher;

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

  abstract get title(): string;

  abstract get stateChangeHandlers(): StateChangeHandler<TContext>[];

  abstract createUi(context: TContext): Promise<GenericSnapElement>;

  abstract buildPermissionContext(): Promise<TContext>;

  /**
   * Resolve the permission request based on the granted context.
   * Subclasses must implement this to handle their specific permission types.
   */
  protected abstract resolvePermissionRequest(
    context: TContext,
  ): Promise<TPermissionRequest>;

  /**
   * Append permission-specific caveats to the caveat builder.
   * Subclasses must implement this to add their specific caveats.
   */
  protected abstract appendCaveats(
    permissionRequest: TPermissionRequest,
    caveatBuilder: CaveatBuilder,
  ): Promise<CaveatBuilder>;

  /**
   * Main orchestration method that coordinates the permission request flow.
   * This method should not be overridden by subclasses.
   */
  async orchestrate(): Promise<{
    success: boolean;
    response?: TPermissionResponse;
    reason?: string;
  }> {
    // todo: this is a bit janky, having to keep a reference to the context
    // _and have the snaps system manage it.
    // I kinda feel like keeping the context locally makes more sense,
    // as we're just passing it back and forth for no reason.
    let context = await this.buildPermissionContext();

    const confirmationDialog =
      this.confirmationDialogFactory.createConfirmation({
        title: this.title,
        justification: this.permissionRequest.permission.data.justification,
        ui: await this.createUi(context),
        context,
      });

    const interfaceId = await confirmationDialog.createInterface();

    const handlerUnbinders = this.stateChangeHandlers.map(
      (stateChangeHandler) => {
        const handler = async ({ event }: { event: InputChangeEvent }) => {
          const value = stateChangeHandler.valueMapper
            ? stateChangeHandler.valueMapper(event)
            : (event.value as string);

          context = stateChangeHandler.contextMapper(context, value);

          confirmationDialog.updateContent({
            ui: await this.createUi(context),
            context,
          });
        };

        this.userEventDispatcher.on({
          eventType: UserInputEventType.InputChangeEvent,
          interfaceId,
          elementName: stateChangeHandler.elementName,
          // todo: fix this
          handler:
            handler as UserEventHandler<UserInputEventType.InputChangeEvent>,
        });

        return () => {
          this.userEventDispatcher.off({
            eventType: UserInputEventType.InputChangeEvent,
            interfaceId,
            elementName: stateChangeHandler.elementName,
            // todo: fix this
            handler:
              handler as UserEventHandler<UserInputEventType.InputChangeEvent>,
          });
        };
      },
    );

    const { isConfirmationGranted, grantedContext } =
      await confirmationDialog.awaitUserDecision();

    // unbind handlers
    handlerUnbinders.forEach((unbinder) => unbinder());

    if (!isConfirmationGranted) {
      return {
        success: false,
        reason: 'User rejected the permissions request',
      };
    }

    const grantedPermissionRequest = this.permissionRequest.isAdjustmentAllowed
      ? await this.resolvePermissionRequest(grantedContext)
      : this.permissionRequest;

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
