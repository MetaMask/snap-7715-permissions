import {
  CoreCaveatBuilder,
  createCaveatBuilder,
  createDelegation,
  encodeDelegation,
} from '@metamask/delegation-toolkit';
import type {
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { AccountController } from '../accountController';
import type { ConfirmationDialogFactory } from './confirmationFactory';
import { BaseContext, DeepRequired } from './types';
import { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { toHex } from 'viem';

export type PermissionRequestResult =
  | { approved: true; response: PermissionResponse }
  | { approved: false; reason: string };

export type LifecycleOrchestrationHandlers<
  TRequest extends PermissionRequest,
  TContext extends BaseContext,
  TMetadata extends object,
  TPermission extends TRequest['permission'],
  TPopulatedPermission extends DeepRequired<TPermission>,
> = {
  validateRequest: (request: TRequest) => TRequest;
  buildContext: (request: TRequest) => Promise<TContext>;
  deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;
  createConfirmationContent: (args: {
    context: TContext;
    metadata: TMetadata;
    origin: string;
    chainId: number;
  }) => Promise<GenericSnapElement>;
  applyContext: (args: {
    context: TContext;
    originalRequest: TRequest;
  }) => Promise<TRequest>;
  populatePermission: (args: {
    permission: TPermission;
  }) => Promise<TPopulatedPermission>;
  appendCaveats: (args: {
    permission: TPopulatedPermission;
    caveatBuilder: CoreCaveatBuilder;
  }) => Promise<CoreCaveatBuilder>;

  /**
   * Optional callback that is invoked when a confirmation dialog is created.
   * @param confirmationCreatedArgs - Arguments containing the interface ID and a function to update the context
   */
  onConfirmationCreated?: (confirmationCreatedArgs: {
    interfaceId: string;
    initialContext: TContext;
    updateContext: (updateContextArgs: {
      updatedContext: TContext;
    }) => Promise<void>;
  }) => void;

  /**
   * Optional callback that is invoked when a confirmation dialog is resolved.
   */
  onConfirmationResolved?: () => void;
};

/**
 * Orchestrator for permission requests.
 * Coordinates the flow of permission requests, confirmation dialogs, and delegation creation.
 */
export class PermissionRequestLifecycleOrchestrator {
  readonly #accountController: AccountController;
  readonly #confirmationDialogFactory: ConfirmationDialogFactory;

  constructor({
    accountController,
    confirmationDialogFactory,
  }: {
    accountController: AccountController;
    confirmationDialogFactory: ConfirmationDialogFactory;
  }) {
    this.#accountController = accountController;
    this.#confirmationDialogFactory = confirmationDialogFactory;
  }

  /**
   * Orchestrates the permission request lifecycle.
   *
   * @param origin - The origin of the permission request
   * @param permissionRequest - The permission request to orchestrate
   * @param lifecycleHandlers - The lifecycle handlers to call during orchestration
   * @returns The permission response
   */
  async orchestrate<
    TRequest extends PermissionRequest,
    TContext extends BaseContext,
    TMetadata extends object,
    TPermission extends TRequest['permission'],
    TPopulatedPermission extends DeepRequired<TPermission>,
  >(
    origin: string,
    permissionRequest: TRequest,
    lifecycleHandlers: LifecycleOrchestrationHandlers<
      TRequest,
      TContext,
      TMetadata,
      TPermission,
      TPopulatedPermission
    >,
  ): Promise<PermissionRequestResult> {
    const isAdjustmentAllowed = permissionRequest.isAdjustmentAllowed ?? true;

    const validatedPermissionRequest =
      lifecycleHandlers.validateRequest(permissionRequest);

    const chainId = parseInt(permissionRequest.chainId, 16);

    let context = await lifecycleHandlers.buildContext(
      validatedPermissionRequest,
    );

    const createUiContent = async () => {
      const metadata = await lifecycleHandlers.deriveMetadata({ context });

      return await lifecycleHandlers.createConfirmationContent({
        context,
        metadata,
        origin,
        chainId,
      });
    };

    const confirmationDialog =
      this.#confirmationDialogFactory.createConfirmation({
        ui: await createUiContent(),
      });

    const interfaceId = await confirmationDialog.createInterface();

    if (lifecycleHandlers.onConfirmationCreated) {
      const updateContext = async ({
        updatedContext,
      }: {
        updatedContext: TContext;
      }) => {
        if (!isAdjustmentAllowed) {
          throw new Error('Adjustment is not allowed');
        }

        context = updatedContext;

        confirmationDialog.updateContent({ ui: await createUiContent() });
      };

      lifecycleHandlers.onConfirmationCreated({
        interfaceId,
        updateContext,
        initialContext: context,
      });
    }

    try {
      const decision = await confirmationDialog.awaitUserDecision();

      if (decision.isConfirmationGranted) {
        // apply the changes made to the context to the request
        const resolvedRequest = await lifecycleHandlers.applyContext({
          context,
          originalRequest: validatedPermissionRequest,
        });

        // populate optional values of the permission
        const populatedPermission = await lifecycleHandlers.populatePermission({
          permission: resolvedRequest.permission as TPermission,
        });

        // the actual permission being granted
        const grantedPermissionRequest = {
          ...resolvedRequest,
          permission: populatedPermission,
        };

        const [address, accountMeta, delegationManager] = await Promise.all([
          this.#accountController.getAccountAddress({
            chainId,
          }),
          this.#accountController.getAccountMetadata({
            chainId,
          }),
          this.#accountController.getDelegationManager({
            chainId,
          }),
        ]);

        const environment = await this.#accountController.getEnvironment({
          chainId,
        });

        // todo: can we decompose assembling the response into a separate function that can be tested independently?
        const caveatBuilder = await lifecycleHandlers.appendCaveats({
          permission: populatedPermission,
          caveatBuilder: createCaveatBuilder(environment),
        });

        const valueAfter = 0;
        const valueBefore = grantedPermissionRequest.expiry;

        const finalCaveatBuilder = caveatBuilder.addCaveat(
          'timestamp',
          valueAfter,
          valueBefore,
        );

        const signedDelegation = await this.#accountController.signDelegation({
          chainId,
          delegation: createDelegation({
            to: grantedPermissionRequest.signer.data.address,
            from: address,
            caveats: finalCaveatBuilder,
          }),
        });
        const permissionsContext = encodeDelegation([signedDelegation]);

        // we do this because we cannot have undefined properties set on the response
        const accountMetaObject =
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
          ...accountMetaObject,
          signerMeta: {
            delegationManager,
          },
        };

        return {
          approved: true,
          response,
        };
      }

      return {
        approved: false,
        reason: 'Permission request denied',
      };
    } finally {
      if (lifecycleHandlers.onConfirmationResolved) {
        lifecycleHandlers.onConfirmationResolved();
      }
    }
  }
}
