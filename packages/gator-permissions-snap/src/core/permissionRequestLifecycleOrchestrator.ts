import type {
  DependencyInfo,
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import {
  extractDescriptorName,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import type { Delegation } from '@metamask/delegation-core';
import {
  createNonceTerms,
  createTimestampTerms,
  encodeDelegations,
  ROOT_AUTHORITY,
} from '@metamask/delegation-core';
import { InvalidInputError, InvalidParamsError } from '@metamask/snaps-sdk';
import {
  bigIntToHex,
  bytesToHex,
  hexToNumber,
  numberToHex,
  parseCaipAccountId,
} from '@metamask/utils';
import type { NonceCaveatService } from 'src/services/nonceCaveatService';

import type { UserEventDispatcher } from '../userEventDispatcher';
import type { AccountController } from './accountController';
import { getChainMetadata } from './chainMetadata';
import type { ConfirmationDialogFactory } from './confirmationFactory';
import type {
  BaseContext,
  BaseMetadata,
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

  readonly #userEventDispatcher: UserEventDispatcher;

  readonly #nonceCaveatService: NonceCaveatService;

  constructor({
    accountController,
    confirmationDialogFactory,
    userEventDispatcher,
    nonceCaveatService,
  }: {
    accountController: AccountController;
    confirmationDialogFactory: ConfirmationDialogFactory;
    userEventDispatcher: UserEventDispatcher;
    nonceCaveatService: NonceCaveatService;
  }) {
    this.#accountController = accountController;
    this.#confirmationDialogFactory = confirmationDialogFactory;
    this.#userEventDispatcher = userEventDispatcher;
    this.#nonceCaveatService = nonceCaveatService;
  }

  /**
   * Asserts that the specified chain ID is supported.
   * @param chainId - The chain ID to validate.
   * @throws If the chain ID is not supported.
   */
  #assertIsSupportedChainId(chainId: number) {
    try {
      getChainMetadata({ chainId });
    } catch (error) {
      logger.error(
        'PermissionRequestLifecycleOrchestrator:assertIsSupportedChainId() - unsupported chainId',
        {
          chainId,
          error,
        },
      );
      throw new InvalidParamsError(`Unsupported ChainId: ${chainId}`);
    }
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
    TMetadata extends BaseMetadata,
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
    const chainId = hexToNumber(permissionRequest.chainId);

    this.#assertIsSupportedChainId(chainId);

    // only necessary when not pre-installed, to ensure that the account
    // permissions are requested before the confirmation dialog is shown.
    await this.#accountController.getAccountAddresses();

    const validatedPermissionRequest =
      lifecycleHandlers.parseAndValidatePermission(permissionRequest);

    const confirmationDialog =
      this.#confirmationDialogFactory.createConfirmation({
        ui: await lifecycleHandlers.createSkeletonConfirmationContent(),
        isGrantDisabled: true,
      });

    const interfaceId = await confirmationDialog.createInterface();

    const decisionPromise =
      confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();

    let context: TContext;
    try {
      context = await lifecycleHandlers.buildContext(
        validatedPermissionRequest,
      );
    } catch (error) {
      await confirmationDialog.closeWithError(error as Error);
      throw error;
    }

    const updateConfirmation = async ({
      newContext,
      isGrantDisabled,
    }: {
      newContext: TContext;
      isGrantDisabled: boolean;
    }) => {
      context = newContext;

      const metadata = await lifecycleHandlers.deriveMetadata({ context });

      const hasValidationErrors = Object.values(
        metadata?.validationErrors ?? {},
      ).some((message) => typeof message === 'string');

      const ui = await lifecycleHandlers.createConfirmationContent({
        context,
        metadata,
        origin,
        chainId,
      });

      await confirmationDialog.updateContent({
        ui,
        isGrantDisabled: isGrantDisabled || hasValidationErrors,
      });
    };

    // replace the skeleton content with the actual content rendered with the resolved context
    try {
      await updateConfirmation({
        newContext: context,
        isGrantDisabled: false,
      });
    } catch (error) {
      await confirmationDialog.closeWithError(error as Error);
      throw error;
    }

    const isAdjustmentAllowed =
      permissionRequest.permission.isAdjustmentAllowed ?? true;

    if (lifecycleHandlers.onConfirmationCreated) {
      const updateContext = async ({
        updatedContext,
      }: {
        updatedContext: TContext;
      }) => {
        try {
          await updateConfirmation({
            newContext: updatedContext,
            isGrantDisabled: false,
          });
        } catch (error) {
          await confirmationDialog.closeWithError(error as Error);
          throw error;
        }
      };

      lifecycleHandlers.onConfirmationCreated({
        interfaceId,
        updateContext,
        initialContext: context,
        isAdjustmentAllowed,
      });
    }

    try {
      const { isConfirmationGranted } = await decisionPromise;

      if (isConfirmationGranted) {
        // Wait for any pending context updates to complete before granting permission
        // This prevents race conditions where the permission is granted before
        // all user input has been processed
        await this.#userEventDispatcher.waitForPendingHandlers();

        // Check if account needs to be upgraded before processing the permission
        // We check again because the account could have been upgraded in the time since permission request was created
        // especially if we consider a scenario where we have a permission batch with the same account.
        try {
          const { address } = parseCaipAccountId(context.accountAddressCaip10);
          const upgradeStatus =
            await this.#accountController.getAccountUpgradeStatus({
              account: address,
              chainId: numberToHex(chainId),
            });

          if (!upgradeStatus.isUpgraded) {
            // Trigger account upgrade
            await this.#accountController.upgradeAccount({
              account: address,
              chainId: numberToHex(chainId),
            });
          }
        } catch (error) {
          // Silently ignore errors here, we don't want to block the permission request if the account upgrade fails
          // TODO: When we know extension has support for account upgrade, we can show an error to the user
        }

        const response = await this.#resolveResponse({
          originalRequest: validatedPermissionRequest,
          modifiedContext: context,
          lifecycleHandlers,
          isAdjustmentAllowed,
          chainId,
          origin,
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
    } catch (error) {
      // Any unexpected error during the flow should immediately close the dialog
      await confirmationDialog.closeWithError(error as Error);
      throw error;
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
   * @param params.isAdjustmentAllowed - Whether the permission can be adjusted.
   * @param params.chainId - The chain ID for the permission.
   * @param params.origin - The origin of the permission request.
   * @param params.lifecycleHandlers - Handlers for the permission lifecycle.
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
    isAdjustmentAllowed,
    chainId,
    origin,
    lifecycleHandlers,
  }: {
    originalRequest: TRequest;
    modifiedContext: TContext;
    isAdjustmentAllowed: boolean;
    chainId: number;
    origin: string;
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

    const { address } = grantedPermissionRequest;
    if (!address) {
      throw new InvalidInputError('Address is undefined');
    }

    const { contracts } = getChainMetadata({ chainId });

    const caveats = await lifecycleHandlers.createPermissionCaveats({
      permission: populatedPermission,
      contracts,
    });

    const expiryRule = resolvedRequest.rules?.find(
      (rule) => extractDescriptorName(rule.type) === 'expiry',
    );

    if (expiryRule) {
      const timestampAfterThreshold = 0;
      const timestampBeforeThreshold = expiryRule.data.timestamp;

      caveats.push({
        enforcer: contracts.timestampEnforcer,
        terms: createTimestampTerms({
          timestampAfterThreshold,
          timestampBeforeThreshold,
        }),
        args: '0x',
      });
    } else {
      throw new InvalidInputError(
        'Expiry rule not found. An expiry is required on all permissions.',
      );
    }

    const nonce = await this.#nonceCaveatService.getNonce({
      chainId,
      account: address,
    });

    caveats.push({
      enforcer: contracts.nonceEnforcer,
      terms: createNonceTerms({
        nonce: bigIntToHex(nonce),
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

    const { justification } = modifiedContext;

    const signedDelegation: Delegation =
      await this.#accountController.signDelegation({
        chainId,
        delegation,
        address,
        origin,
        justification,
      });

    const context = encodeDelegations([signedDelegation], { out: 'hex' });

    // dependencyInfo is always empty for EIP-7702 accounts
    const dependencyInfo: DependencyInfo[] = [];

    const response: PermissionResponse = {
      ...grantedPermissionRequest,
      chainId: numberToHex(chainId),
      address,
      dependencyInfo,
      context,
      signerMeta: {
        delegationManager: contracts.delegationManager,
      },
    };
    return response;
  }
}
