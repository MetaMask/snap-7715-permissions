import type {
  Dependency,
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

import type { AccountController } from './accountController';
import { getChainMetadata } from './chainMetadata';
import type { ConfirmationDialogFactory } from './confirmationFactory';
import type { DialogInterfaceFactory } from './dialogInterfaceFactory';
import type { PermissionIntroductionService } from './permissionIntroduction';
import type {
  BaseContext,
  BaseMetadata,
  DeepRequired,
  LifecycleOrchestrationHandlers,
  PermissionRequestResult,
} from './types';
import type { NonceCaveatService } from '../services/nonceCaveatService';
import type { SnapsMetricsService } from '../services/snapsMetricsService';

/**
 * Orchestrator for the permission request lifecycle.
 * Orchestrates the lifecycle of permission requests, confirmation dialogs, and delegation creation.
 */
export class PermissionRequestLifecycleOrchestrator {
  readonly #accountController: AccountController;

  readonly #confirmationDialogFactory: ConfirmationDialogFactory;

  readonly #nonceCaveatService: NonceCaveatService;

  readonly #snapsMetricsService: SnapsMetricsService;

  readonly #permissionIntroductionService: PermissionIntroductionService;

  readonly #dialogInterfaceFactory: DialogInterfaceFactory;

  constructor({
    accountController,
    confirmationDialogFactory,
    nonceCaveatService,
    snapsMetricsService,
    permissionIntroductionService,
    dialogInterfaceFactory,
  }: {
    accountController: AccountController;
    confirmationDialogFactory: ConfirmationDialogFactory;
    nonceCaveatService: NonceCaveatService;
    snapsMetricsService: SnapsMetricsService;
    permissionIntroductionService: PermissionIntroductionService;
    dialogInterfaceFactory: DialogInterfaceFactory;
  }) {
    this.#accountController = accountController;
    this.#confirmationDialogFactory = confirmationDialogFactory;
    this.#nonceCaveatService = nonceCaveatService;
    this.#snapsMetricsService = snapsMetricsService;
    this.#permissionIntroductionService = permissionIntroductionService;
    this.#dialogInterfaceFactory = dialogInterfaceFactory;
  }

  /**
   * Asserts that the specified chain ID is supported.
   * @param chainId - The chain ID to validate.
   * @throws If the chain ID is not supported.
   */
  #assertIsSupportedChainId(chainId: number): void {
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
    const permissionType = extractDescriptorName(
      permissionRequest.permission.type,
    );

    this.#assertIsSupportedChainId(chainId);

    // Track permission request started
    await this.#snapsMetricsService.trackPermissionRequestStarted({
      origin,
      permissionType,
      chainId: permissionRequest.chainId,
      permissionData: permissionRequest.permission.data,
    });

    // Create shared dialog interface for both intro and confirmation
    const dialogInterface =
      this.#dialogInterfaceFactory.createDialogInterface();

    // Check if we need to show introduction
    if (
      await this.#permissionIntroductionService.shouldShowIntroduction(
        permissionType,
      )
    ) {
      const { wasCancelled } =
        await this.#permissionIntroductionService.showIntroduction({
          dialogInterface,
          permissionType,
        });

      // If user cancelled the introduction, reject the permission request
      if (wasCancelled) {
        await this.#snapsMetricsService.trackPermissionRejected({
          origin,
          permissionType,
          chainId: permissionRequest.chainId,
          permissionData: permissionRequest.permission.data,
        });

        return {
          approved: false,
          reason: 'Permission request denied',
        };
      }

      await this.#permissionIntroductionService.markIntroductionAsSeen(
        permissionType,
      );
    }

    // only necessary when not pre-installed, to ensure that the account
    // permissions are requested before the confirmation dialog is shown.
    await this.#accountController.getAccountAddresses();

    const validatedPermissionRequest =
      lifecycleHandlers.parseAndValidatePermission(permissionRequest);

    let context: TContext;

    const hasValidationErrors = (metadata: TMetadata): boolean => {
      return Object.values(metadata?.validationErrors ?? {}).some(
        (message) => typeof message === 'string',
      );
    };

    // Validation callback that runs when grant button is clicked.
    // Race condition scenario this prevents:
    //   1. User types invalid input → validation debounced (500ms delay)
    //   2. User clicks Grant before 500ms elapses (button still enabled)
    //   3. Button click event flushes all pending debounced events
    //   4. Validation runs → updates UI with errors & disables button
    //   5. Button handler already invoked (button was enabled at click time)
    //   6. This callback catches it → returns false → dialog stays open
    const onBeforeGrant = async (): Promise<boolean> => {
      const metadata = await lifecycleHandlers.deriveMetadata({ context });
      return !hasValidationErrors(metadata);
    };

    // Create confirmation dialog with the shared dialog interface
    const skeletonUi =
      await lifecycleHandlers.createSkeletonConfirmationContent();
    const confirmationDialog =
      this.#confirmationDialogFactory.createConfirmation({
        dialogInterface,
        ui: skeletonUi,
        onBeforeGrant,
      });

    const interfaceId = await confirmationDialog.initialize();

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
    }): Promise<void> => {
      context = newContext;

      const metadata = await lifecycleHandlers.deriveMetadata({ context });

      const ui = await lifecycleHandlers.createConfirmationContent({
        context,
        metadata,
        origin,
        chainId,
      });

      await confirmationDialog.updateContent({
        ui,
        isGrantDisabled: isGrantDisabled || hasValidationErrors(metadata),
      });
    };

    const decisionPromise =
      confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();

    // replace the skeleton content with the actual content rendered with the resolved context
    try {
      await updateConfirmation({
        newContext: context,
        isGrantDisabled: false,
      });

      // Track dialog shown after successful rendering
      await this.#snapsMetricsService.trackPermissionDialogShown({
        origin,
        permissionType,
        chainId: permissionRequest.chainId,
        permissionData: permissionRequest.permission.data,
        justification: context.justification,
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
      }): Promise<void> => {
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
            let upgradeSuccess = false;
            try {
              await this.#accountController.upgradeAccount({
                account: address,
                chainId: numberToHex(chainId),
              });
              upgradeSuccess = true;
            } finally {
              // Track account upgrade result
              await this.#snapsMetricsService.trackSmartAccountUpgraded({
                origin,
                accountAddress: address,
                chainId: numberToHex(chainId),
                success: upgradeSuccess,
              });
            }
          }
        } catch {
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

      await this.#snapsMetricsService.trackPermissionRejected({
        origin,
        permissionType,
        chainId: permissionRequest.chainId,
        permissionData: permissionRequest.permission.data,
        justification: context.justification,
      });

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
    const permissionType = extractDescriptorName(
      originalRequest.permission.type,
    );

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

    const { from, to } = grantedPermissionRequest;
    if (!from) {
      throw new InvalidInputError('Address is undefined');
    }
    if (!to) {
      throw new InvalidInputError('Delegate address is undefined');
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
    }

    const nonce = await this.#nonceCaveatService.getNonce({
      chainId,
      account: from,
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
      delegate: to,
      authority: ROOT_AUTHORITY,
      delegator: from,
      caveats,
      salt: BigInt(salt),
    } as const;

    const { justification } = modifiedContext;

    let signedDelegation: Delegation;
    let signingSuccess = false;
    let signingError: Error | undefined;
    try {
      signedDelegation = await this.#accountController.signDelegation({
        chainId,
        delegation,
        address: from,
        origin,
        justification,
      });
      signingSuccess = true;
    } catch (error) {
      signingError = error as Error;
      throw error;
    } finally {
      // Track delegation signing result
      await this.#snapsMetricsService.trackDelegationSigning({
        origin,
        permissionType,
        success: signingSuccess,
        ...(signingError && { errorMessage: signingError.message }),
      });
    }

    const context = encodeDelegations([signedDelegation], { out: 'hex' });

    // dependencies is always empty for EIP-7702 accounts
    const dependencies: Dependency[] = [];

    const response: PermissionResponse = {
      ...grantedPermissionRequest,
      chainId: numberToHex(chainId),
      from,
      dependencies,
      context,
      delegationManager: contracts.delegationManager,
    };

    // Track successful permission grant
    await this.#snapsMetricsService.trackPermissionGranted({
      origin,
      permissionType,
      chainId: numberToHex(chainId),
      permissionData: populatedPermission.data,
      justification: modifiedContext.justification,
      isAdjustmentAllowed,
    });

    return response;
  }
}
