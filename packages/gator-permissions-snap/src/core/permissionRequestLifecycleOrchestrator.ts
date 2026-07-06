import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  extractDescriptorName,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';
import { hexToNumber, numberToHex, parseCaipAccountId } from '@metamask/utils';

import type { AccountController } from './accountController';
import { getChainMetadata } from './chainMetadata';
import type { ConfirmationDialogFactory } from './confirmationFactory';
import type { ExistingPermissionsCoordinator } from './coordinators/ExistingPermissionsCoordinator';
import type { TrustSignalsCoordinator } from './coordinators/TrustSignalsCoordinator';
import type { DialogInterfaceFactory } from './dialogInterfaceFactory';
import type { GrantedPermissionResolutionService } from './grant/GrantedPermissionResolutionService';
import type { PermissionIntroductionService } from './permissionIntroduction';
import { normalizePermissionRequestWithSentinelRedeemerRule } from './sentinelRedeemer';
import type {
  BaseContext,
  BaseMetadata,
  DeepRequired,
  LifecycleOrchestrationHandlers,
  PermissionRequestResult,
} from './types';
import type { SnapsMetricsService } from '../services/snapsMetricsService';

/**
 * Orchestrator for the permission request lifecycle.
 * Orchestrates the lifecycle of permission requests, confirmation dialogs, and delegation creation.
 */
export class PermissionRequestLifecycleOrchestrator {
  readonly #accountController: AccountController;

  readonly #confirmationDialogFactory: ConfirmationDialogFactory;

  readonly #snapsMetricsService: SnapsMetricsService;

  readonly #permissionIntroductionService: PermissionIntroductionService;

  readonly #existingPermissionsCoordinator: ExistingPermissionsCoordinator;

  readonly #dialogInterfaceFactory: DialogInterfaceFactory;

  readonly #trustSignalsCoordinator: TrustSignalsCoordinator;

  readonly #grantedPermissionResolutionService: GrantedPermissionResolutionService;

  constructor({
    accountController,
    confirmationDialogFactory,
    snapsMetricsService,
    permissionIntroductionService,
    existingPermissionsCoordinator,
    dialogInterfaceFactory,
    trustSignalsCoordinator,
    grantedPermissionResolutionService,
  }: {
    accountController: AccountController;
    confirmationDialogFactory: ConfirmationDialogFactory;
    snapsMetricsService: SnapsMetricsService;
    permissionIntroductionService: PermissionIntroductionService;
    existingPermissionsCoordinator: ExistingPermissionsCoordinator;
    dialogInterfaceFactory: DialogInterfaceFactory;
    trustSignalsCoordinator: TrustSignalsCoordinator;
    grantedPermissionResolutionService: GrantedPermissionResolutionService;
  }) {
    this.#accountController = accountController;
    this.#confirmationDialogFactory = confirmationDialogFactory;
    this.#snapsMetricsService = snapsMetricsService;
    this.#permissionIntroductionService = permissionIntroductionService;
    this.#existingPermissionsCoordinator = existingPermissionsCoordinator;
    this.#dialogInterfaceFactory = dialogInterfaceFactory;
    this.#trustSignalsCoordinator = trustSignalsCoordinator;
    this.#grantedPermissionResolutionService =
      grantedPermissionResolutionService;
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
    this.#assertIsSupportedChainId(chainId);

    const permissionType = extractDescriptorName(
      permissionRequest.permission.type,
    );

    // Track permission request started
    await this.#snapsMetricsService.trackPermissionRequestStarted({
      origin,
      permissionType,
      chainId: permissionRequest.chainId,
      permissionData: permissionRequest.permission.data,
    });

    // Validate the permission request early, before showing any UI
    const validatedPermissionRequest =
      lifecycleHandlers.parseAndValidatePermission(permissionRequest);
    const normalizedPermissionRequest =
      normalizePermissionRequestWithSentinelRedeemerRule({
        origin,
        permissionRequest: validatedPermissionRequest,
        chainId,
      });

    // Create shared dialog interface for both intro and confirmation
    const dialogInterface =
      this.#dialogInterfaceFactory.createDialogInterface();

    const {
      snapshotPromise: existingPermissionsForOriginPromise,
      statusPromise: existingPermissionsStatusPromise,
    } = this.#existingPermissionsCoordinator.prefetch(
      origin,
      normalizedPermissionRequest.permission,
    );

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
          reason: 'Permission request denied at introduction screen',
        };
      }

      await this.#permissionIntroductionService.markIntroductionAsSeen(
        permissionType,
      );
    }

    // only necessary when not pre-installed, to ensure that the account
    // permissions are requested before the confirmation dialog is shown.
    await this.#accountController.getAccountAddresses();

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
        normalizedPermissionRequest,
      );
    } catch (error) {
      await confirmationDialog.closeWithError(error as Error);
      throw error;
    }

    const decisionPromise =
      confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();

    let lastUpdateConfirmationPromise: Promise<void> = Promise.resolve();

    /** Avoid re-running skeleton + format when trust-signal refreshes fire while the subview is open. */
    let existingPermissionsSubviewActive = false;

    const updateConfirmation = async ({
      newContext,
      isGrantDisabled,
    }: {
      newContext?: TContext;
      isGrantDisabled: boolean;
    }): Promise<void> => {
      const runUpdate = async (): Promise<void> => {
        if (newContext) {
          context = newContext;
        }

        const metadata = await lifecycleHandlers.deriveMetadata({ context });

        const existingPermissionsStatus =
          await existingPermissionsStatusPromise;

        const grantDisabled = isGrantDisabled || hasValidationErrors(metadata);

        const { scanDappUrlResult, scanAddressResult } =
          this.#trustSignalsCoordinator.getResults();

        if (context.showExistingPermissions) {
          const enteringSubview = !existingPermissionsSubviewActive;
          if (enteringSubview) {
            // Set synchronously before awaits so eslint require-atomic-updates is satisfied;
            // runUpdate calls are serialized via lastUpdateConfirmationPromise.
            existingPermissionsSubviewActive = true;
          }

          await this.#existingPermissionsCoordinator.maybeShowSubview({
            dialogInterface,
            context,
            enteringSubview,
            snapshotPromise: existingPermissionsForOriginPromise,
          });

          return;
        }

        existingPermissionsSubviewActive = false;

        const ui = await lifecycleHandlers.createConfirmationContent({
          context,
          metadata,
          origin,
          chainId,
          scanDappUrlResult,
          scanAddressResult,
          existingPermissionsStatus,
          isGrantDisabled: grantDisabled,
        });

        await confirmationDialog.updateContent({ ui });
      };

      lastUpdateConfirmationPromise =
        lastUpdateConfirmationPromise.finally(runUpdate);

      await lastUpdateConfirmationPromise;
    };

    this.#trustSignalsCoordinator.start({
      origin,
      chainId: normalizedPermissionRequest.chainId,
      delegateAddress: normalizedPermissionRequest.to,
      onResults: () => {
        updateConfirmation({
          isGrantDisabled: false,
        }).catch((error: unknown) => {
          logger.debug(
            'PermissionRequestLifecycleOrchestrator: trust signal UI update failed',
            { origin, error: error instanceof Error ? error.message : error },
          );
        });
      },
    });

    // replace the skeleton content with the actual content rendered with the resolved context
    try {
      await updateConfirmation({
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

        const response = await this.#grantedPermissionResolutionService.resolve(
          {
            originalRequest: normalizedPermissionRequest,
            modifiedContext: context,
            lifecycleHandlers,
            isAdjustmentAllowed,
            chainId,
            origin,
          },
        );

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
        reason: 'Permission request denied at confirmation screen',
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
}
