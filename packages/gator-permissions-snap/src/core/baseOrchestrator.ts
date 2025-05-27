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
import { bytesToHex, toHex } from 'viem';

import type { AccountController } from '../accountController';
import { RuleModalManager } from '../permissions/ruleModalManager';
import type { RuleDefinition } from '../permissions/rules';
import { bindRuleHandlers } from '../permissions/rules';
import type {
  UserEventDispatcher,
  UserEventHandler,
  UserInputEventByType,
} from '../userEventDispatcher';
import type { ConfirmationDialogFactory } from './confirmationFactory';
import type {
  BaseContext,
  StateChangeHandler,
  Orchestrator,
  DeepRequired,
} from './types';

/**
 * Base class for permission orchestrators that handle the core flow of permission requests.
 * Subclasses must implement specific methods to handle UI, validation, and permission context.
 */
export abstract class BaseOrchestrator<
  TPermissionRequest extends PermissionRequest = PermissionRequest,
  TContext extends BaseContext = BaseContext,
  TMetadata extends object = object,
  TPopulatedPermission extends DeepRequired<
    TPermissionRequest['permission']
  > = DeepRequired<TPermissionRequest['permission']>,
> implements Orchestrator
{
  protected readonly accountController: AccountController;

  protected readonly confirmationDialogFactory: ConfirmationDialogFactory;

  protected readonly userEventDispatcher: UserEventDispatcher;

  #currentContext: TContext | undefined;

  protected readonly rules: RuleDefinition<TContext, TMetadata>[];

  readonly #permissionRequest: TPermissionRequest;

  constructor({
    accountController,
    permissionRequest,
    confirmationDialogFactory,
    userEventDispatcher,
    rules,
  }: {
    accountController: AccountController;
    permissionRequest: TPermissionRequest;
    confirmationDialogFactory: ConfirmationDialogFactory;
    userEventDispatcher: UserEventDispatcher;
    rules: RuleDefinition<TContext, TMetadata>[];
  }) {
    this.accountController = accountController;
    this.confirmationDialogFactory = confirmationDialogFactory;
    this.userEventDispatcher = userEventDispatcher;
    this.#permissionRequest = permissionRequest;
    this.rules = rules;
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
    showAddMoreRulesButton: boolean;
  }): Promise<GenericSnapElement>;

  /**
   * Populate any default values in the permission.
   */
  protected abstract populatePermission(args: {
    permission: TPermissionRequest['permission'];
  }): Promise<TPopulatedPermission>;

  /**
   * Append permission-specific caveats to the caveat builder.
   */
  protected abstract appendCaveats(
    permissionRequest: TPopulatedPermission,
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
          showAddMoreRulesButton: false,
        }),
      });

    const interfaceId = await confirmationDialog.createInterface();

    // we need to declare the ruleModalManager here so that it can be accessed
    // in the onContextChanged handler we could make the instantiation of the
    // ruleModalManager and binding of it two steps, but we plan to move the
    // rule modal manager out of here anyways
    // eslint-disable-next-line prefer-const
    let ruleModalManager: RuleModalManager<TContext, TMetadata>;

    const rerenderModal = async (context: TContext) => {
      const metadata = await this.createContextMetadata(context);

      const ui = ruleModalManager.isModalVisible()
        ? await ruleModalManager.renderModal()
        : await this.createUiContent({
            context,
            metadata,
            origin,
            chainId,
            showAddMoreRulesButton: ruleModalManager.hasRulesToAdd({ context }),
          });

      await confirmationDialog.updateContent({
        ui,
      });
    };

    const getContext = () => {
      if (this.#currentContext === undefined) {
        throw new Error('Current context is undefined');
      }
      return this.#currentContext;
    };

    const onContextChanged = async ({ context }: { context?: TContext }) => {
      if (context) {
        this.#currentContext = context;
      }

      await rerenderModal(getContext());
    };

    // derives metadata from either the provided context or the current context if none is specified
    const deriveMetadata = async (args?: { context: TContext }) => {
      return this.createContextMetadata(args?.context ?? getContext());
    };

    const unbindStateChangeHandlers = this.#bindStateChangeHandlers({
      userEventDispatcher: this.userEventDispatcher,
      stateChangeHandlers: this.stateChangeHandlers,
      interfaceId,
      onContextChanged,
      getContext,
      deriveMetadata,
    });

    ruleModalManager = new RuleModalManager<TContext, TMetadata>({
      userEventDispatcher: this.userEventDispatcher,
      interfaceId,
      rules: this.rules,
      onModalChanged: async () => onContextChanged({}),
      getContext,
      onContextChanged,
      deriveMetadata,
    });

    ruleModalManager.bindHandlers();

    const unbindRuleHandlers = bindRuleHandlers({
      userEventDispatcher: this.userEventDispatcher,
      interfaceId,
      rules: this.rules,
      getContext,
      onContextChanged,
    });

    try {
      const { isConfirmationGranted } =
        await confirmationDialog.awaitUserDecision();

      if (!isConfirmationGranted) {
        return {
          success: false,
          reason: 'User rejected the permissions request',
        };
      }
    } finally {
      unbindRuleHandlers();
      ruleModalManager.unbindHandlers();
      unbindStateChangeHandlers();
    }

    const isAdjustmentAllowed =
      this.#permissionRequest.isAdjustmentAllowed ?? true;

    const resolvedPermissionRequest = isAdjustmentAllowed
      ? await this.resolvePermissionRequest({
          context: this.#currentContext,
          originalRequest: this.#permissionRequest,
        })
      : this.#permissionRequest;

    const grantedPermission = await this.populatePermission({
      permission: resolvedPermissionRequest.permission,
    });

    const grantedPermissionRequest = {
      ...resolvedPermissionRequest,
      permission: grantedPermission,
      isAdjustmentAllowed,
    };

    const [address, accountMeta, delegationManager] = await Promise.all([
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

    // use a random salt to ensure unique delegation
    const saltBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      saltBytes[i] = Math.floor(Math.random() * 256);
    }
    const salt = bytesToHex(saltBytes);

    // todo: createDelegation helper should accept salt as an argument
    const delegation = {
      ...createDelegation({
        to: this.#permissionRequest.signer.data.address,
        from: address,
        caveats: appendedCaveatBuilder,
      }),
      salt,
    } as const;

    const signedDelegation = await this.accountController.signDelegation({
      chainId,
      delegation,
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

  #bindStateChangeHandlers({
    stateChangeHandlers,
    onContextChanged,
    getContext,
    deriveMetadata,
    interfaceId,
    userEventDispatcher,
  }: {
    stateChangeHandlers: StateChangeHandler<TContext, TMetadata>[];
    onContextChanged: (args: { context?: TContext }) => void | Promise<void>;
    getContext: () => TContext | undefined;
    deriveMetadata: () => Promise<TMetadata>;
    interfaceId: string;
    userEventDispatcher: UserEventDispatcher;
  }) {
    const handlerUnbinders = stateChangeHandlers.map((stateChangeHandler) => {
      const handler: UserEventHandler<UserInputEventType> = async ({
        event,
      }: {
        event: UserInputEventByType<UserInputEventType>;
      }) => {
        let context = getContext();
        const metadata = await deriveMetadata();
        if (!context) {
          throw new Error('Current context is undefined');
        }

        if (!metadata) {
          throw new Error('Current metadata is undefined');
        }

        context = stateChangeHandler.contextMapper({
          context,
          metadata,
          event,
        });
        await onContextChanged({ context });
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
  }
}
