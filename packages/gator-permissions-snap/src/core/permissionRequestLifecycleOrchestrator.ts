import type {
  AccountMeta,
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import {
  createCaveatBuilder,
  createDelegation,
  encodeDelegation,
} from '@metamask/delegation-toolkit';
import { bytesToHex, toHex } from 'viem';

import type { AccountController } from '../accountController';
import type { ConfirmationDialogFactory } from './confirmationFactory';
import type {
  BaseContext,
  DeepRequired,
  LifecycleOrchestrationHandlers,
  PermissionRequestResult,
} from './types';

/**
 * Orchestrator for the permission request lifecycle.
 * Orchestrates the lifecycle of permission requests, confirmation dialogs, and delegation creation.
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
   * @param origin - The origin of the permission request.
   * @param permissionRequest - The permission request to orchestrate.
   * @param lifecycleHandlers - The lifecycle handlers to call during orchestration.
   * @returns The permission response.
   */
  async orchestrate<
    TRequest extends PermissionRequest,
    TContext extends BaseContext,
    TMetadata extends object,
    TPermission extends TRequest['permission'],
    TPopulatedPermission extends DeepRequired<TPermission>,
  >(
    origin: string,
    permissionRequest: PermissionRequest,
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
      lifecycleHandlers.parseAndValidatePermission(permissionRequest);

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

        await confirmationDialog.updateContent({ ui: await createUiContent() });
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
        const response = await this.#resolveResponse({
          originalRequest: validatedPermissionRequest,
          modifiedContext: context,
          lifecycleHandlers,
          isAdjustmentAllowed,
          chainId,
        });

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

  /**
   * Resolves a permission request into a final permission response.
   *
   * @private
   * @template TRequest - Type of permission request
   * @template TContext - Type of context for the permission request.
   * @template TMetadata - Type of metadata associated with the permission request.
   * @template TPermission - Type of permission being requested.
   * @template TPopulatedPermission - Type of fully populated permission with all required fields.
   * @param params - Parameters for resolving the response.
   * @param params.originalRequest - The original unmodified permission request.
   * @param params.modifiedContext - The possibly modified context after user interaction.
   * @param params.lifecycleHandlers - Handlers for the permission lifecycle.
   * @param params.isAdjustmentAllowed - Whether the permission can be adjusted.
   * @param params.chainId - The chain ID for the permission.
   * @returns The resolved permission response.
   */
  async #resolveResponse<
    TRequest extends PermissionRequest,
    TContext extends BaseContext,
    TMetadata extends object,
    TPermission extends TRequest['permission'],
    TPopulatedPermission extends DeepRequired<TPermission>,
  >({
    originalRequest,
    modifiedContext,
    lifecycleHandlers,
    isAdjustmentAllowed,
    chainId,
  }: {
    originalRequest: TRequest;
    modifiedContext: TContext;
    isAdjustmentAllowed: boolean;
    chainId: number;
    lifecycleHandlers: LifecycleOrchestrationHandlers<
      TRequest,
      TContext,
      TMetadata,
      TPermission,
      TPopulatedPermission
    >;
  }): Promise<PermissionResponse> {
    // apply the changes made to the context to the request
    const resolvedRequest = await lifecycleHandlers.applyContext({
      context: modifiedContext,
      originalRequest,
    });

    // populate optional values of the permission
    const populatedPermission = await lifecycleHandlers.populatePermission({
      permission: resolvedRequest.permission as TPermission,
    });

    // the actual permission being granted
    const grantedPermissionRequest = {
      ...resolvedRequest,
      permission: populatedPermission,
      isAdjustmentAllowed,
    };

    const [environment, address, accountMetadata, delegationManager] =
      await Promise.all([
        this.#accountController.getEnvironment({
          chainId,
        }),
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

    const caveatBuilder = await lifecycleHandlers.appendCaveats({
      permission: populatedPermission,
      caveatBuilder: createCaveatBuilder(environment),
    });

    const validAfter = 0;
    const validBefore = grantedPermissionRequest.expiry;

    const finalCaveatBuilder = caveatBuilder.addCaveat(
      'timestamp',
      validAfter,
      validBefore,
    );

    // use a random salt to ensure unique delegation
    const saltBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      saltBytes[i] = Math.floor(Math.random() * 256);
    }
    const salt = bytesToHex(saltBytes);

    const delegation = {
      ...createDelegation({
        to: grantedPermissionRequest.signer.data.address,
        from: address,
        caveats: finalCaveatBuilder,
      }),
      salt,
    } as const;

    const signedDelegation = await this.#accountController.signDelegation({
      chainId,
      delegation,
    });

    const context = encodeDelegation([signedDelegation]);

    const accountMeta: AccountMeta[] =
      accountMetadata.factory && accountMetadata.factoryData
        ? [
            {
              factory: accountMetadata.factory,
              factoryData: accountMetadata.factoryData,
            },
          ]
        : [];

    const response: PermissionResponse = {
      ...grantedPermissionRequest,
      chainId: toHex(chainId),
      address,
      accountMeta,
      context,
      signerMeta: {
        delegationManager,
      },
    };
    return response;
  }
}
