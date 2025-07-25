import type {
  AccountMeta,
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { Delegation } from '@metamask/delegation-core';
import {
  createTimestampTerms,
  encodeDelegations,
  ROOT_AUTHORITY,
} from '@metamask/delegation-core';
import { bytesToHex, hexToNumber, numberToHex } from '@metamask/utils';

import type { AccountController } from '../accountController';
import { getChainMetadata } from './chainMetadata';
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
    const validatedPermissionRequest =
      lifecycleHandlers.parseAndValidatePermission(permissionRequest);

    const confirmationDialog =
      this.#confirmationDialogFactory.createConfirmation({
        ui: await lifecycleHandlers.createSkeletonConfirmationContent(),
        isGrantDisabled: true,
      });

    const interfaceId = await confirmationDialog.createInterface();

    const decision =
      confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();

    const chainId = hexToNumber(permissionRequest.chainId);

    let context = await lifecycleHandlers.buildContext(
      validatedPermissionRequest,
    );

    const updateConfirmation = async ({
      newContext,
      isGrantDisabled,
    }: {
      newContext: TContext;
      isGrantDisabled: boolean;
    }) => {
      context = newContext;

      const metadata = await lifecycleHandlers.deriveMetadata({ context });

      const ui = await lifecycleHandlers.createConfirmationContent({
        context,
        metadata,
        origin,
        chainId,
      });

      await confirmationDialog.updateContent({ ui, isGrantDisabled });
    };

    // replace the skeleton content with the actual content rendered with the resolved context
    await updateConfirmation({
      newContext: context,
      isGrantDisabled: false,
    });

    const isAdjustmentAllowed = permissionRequest.isAdjustmentAllowed ?? true;

    if (lifecycleHandlers.onConfirmationCreated) {
      const updateContext = async ({
        updatedContext,
      }: {
        updatedContext: TContext;
      }) => {
        if (!isAdjustmentAllowed) {
          throw new Error('Adjustment is not allowed');
        }

        await updateConfirmation({
          newContext: updatedContext,
          isGrantDisabled: false,
        });
      };

      lifecycleHandlers.onConfirmationCreated({
        interfaceId,
        updateContext,
        initialContext: context,
      });
    }

    try {
      const { isConfirmationGranted } = await decision;

      if (isConfirmationGranted) {
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

    const [address, accountMetadata] = await Promise.all([
      this.#accountController.getAccountAddress({
        chainId,
      }),
      this.#accountController.getAccountMetadata({
        chainId,
      }),
    ]);

    const { contracts } = getChainMetadata({ chainId });
    const {
      enforcers: { TimestampEnforcer },
      delegationManager,
    } = contracts;

    const caveats = await lifecycleHandlers.createPermissionCaveats({
      permission: populatedPermission,
      contracts,
    });

    const timestampAfterThreshold = 0;
    const timestampBeforeThreshold = grantedPermissionRequest.expiry;

    caveats.push({
      enforcer: TimestampEnforcer,
      terms: createTimestampTerms({
        timestampAfterThreshold,
        timestampBeforeThreshold,
      }),
      args: '0x',
    });

    // eslint-disable-next-line no-restricted-globals
    const saltBytes = crypto.getRandomValues(new Uint8Array(32));
    const salt = bytesToHex(saltBytes);

    const delegation = {
      delegate: grantedPermissionRequest.signer.data.address,
      authority: ROOT_AUTHORITY,
      delegator: address,
      caveats,
      salt: BigInt(salt),
    } as const;

    const signedDelegation: Delegation =
      await this.#accountController.signDelegation({
        chainId,
        delegation,
      });

    const context = encodeDelegations([signedDelegation], { out: 'hex' });

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
      chainId: numberToHex(chainId),
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
