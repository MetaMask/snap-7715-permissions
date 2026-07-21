import type {
  Permission,
  PermissionRequest,
} from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import { numberToHex, parseCaipAccountId } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type { TrustSignalsClient } from '../../clients/trustSignalsClient';
import type { SnapsMetricsService } from '../../services/snapsMetricsService';
import type { AccountController } from '../accountController';
import type { ConfirmationDialogFactory } from '../confirmationFactory';
import { ExistingPermissionsCoordinator } from '../coordinators/ExistingPermissionsCoordinator';
import { TrustSignalsCoordinator } from '../coordinators/TrustSignalsCoordinator';
import type { DialogInterface } from '../dialogInterface';
import type { DialogInterfaceFactory } from '../dialogInterfaceFactory';
import type { ExistingPermissionsService } from '../existingpermissions';
import type { PermissionRequestLifecycleHandlers } from '../permission/PermissionRequestLifecycleHandlers';
import type { PermissionIntroductionService } from '../permissionIntroduction';
import type { BaseContext, BaseMetadata, DeepRequired } from '../types';

/**
 * Result of running a confirmation session through intro and grant UI.
 */
export type ConfirmationSessionResult<TContext extends BaseContext> =
  | {
      isApproved: false;
      reason: string;
    }
  | { isApproved: true; context: TContext };

/**
 * Owns dialog lifecycle and shared {@link DialogInterface} creation for a single
 * permission request. Intro, confirmation, and existing-permissions subviews
 * all consume the same interface instance.
 */
export class ConfirmationSession {
  readonly #dialogInterfaceFactory: DialogInterfaceFactory;

  readonly #confirmationDialogFactory: ConfirmationDialogFactory;

  readonly #permissionIntroductionService: PermissionIntroductionService;

  readonly #existingPermissionsService: ExistingPermissionsService;

  readonly #trustSignalsClient: TrustSignalsClient;

  readonly #accountController: AccountController;

  readonly #snapsMetricsService: SnapsMetricsService;

  constructor({
    dialogInterfaceFactory,
    confirmationDialogFactory,
    permissionIntroductionService,
    existingPermissionsService,
    trustSignalsClient,
    accountController,
    snapsMetricsService,
  }: {
    dialogInterfaceFactory: DialogInterfaceFactory;
    confirmationDialogFactory: ConfirmationDialogFactory;
    permissionIntroductionService: PermissionIntroductionService;
    existingPermissionsService: ExistingPermissionsService;
    trustSignalsClient: TrustSignalsClient;
    accountController: AccountController;
    snapsMetricsService: SnapsMetricsService;
  }) {
    this.#dialogInterfaceFactory = dialogInterfaceFactory;
    this.#confirmationDialogFactory = confirmationDialogFactory;
    this.#permissionIntroductionService = permissionIntroductionService;
    this.#existingPermissionsService = existingPermissionsService;
    this.#trustSignalsClient = trustSignalsClient;
    this.#accountController = accountController;
    this.#snapsMetricsService = snapsMetricsService;
  }

  /**
   * Runs intro (when needed), confirmation dialog, and user decision for one request.
   *
   * @param args - Session parameters and lifecycle handlers.
   * @param args.origin - Site origin for the permission request.
   * @param args.permissionType - Descriptor name of the permission type.
   * @param args.normalizedRequest - Validated and normalized permission request.
   * @param args.chainId - Numeric chain ID for confirmation rendering.
   * @param args.lifecycleHandlers - Permission-specific lifecycle callbacks.
   * @returns Approved context or rejection reason with the phase where it occurred.
   */
  async run<
    TRequest extends PermissionRequest,
    TContext extends BaseContext,
    TMetadata extends BaseMetadata,
    TPermission extends TRequest['permission'],
    TPopulatedPermission extends DeepRequired<TPermission>,
  >(args: {
    origin: string;
    permissionType: string;
    normalizedRequest: TRequest;
    chainId: number;
    lifecycleHandlers: PermissionRequestLifecycleHandlers<
      TRequest,
      TContext,
      TMetadata,
      TPermission,
      TPopulatedPermission
    >;
  }): Promise<ConfirmationSessionResult<TContext>> {
    const {
      origin,
      permissionType,
      normalizedRequest,
      chainId,
      lifecycleHandlers,
    } = args;

    const dialogInterface =
      this.#dialogInterfaceFactory.createDialogInterface();

    const existingPermissionsCoordinator = new ExistingPermissionsCoordinator({
      existingPermissionsService: this.#existingPermissionsService,
    });
    const trustSignalsCoordinator = new TrustSignalsCoordinator({
      trustSignalsClient: this.#trustSignalsClient,
    });

    existingPermissionsCoordinator.prefetch(
      origin,
      normalizedRequest.permission,
    );
    trustSignalsCoordinator.start({
      origin,
      chainId: normalizedRequest.chainId,
      delegateAddress: normalizedRequest.to,
    });

    const introResult = await this.#runIntroductionIfNeeded({
      dialogInterface,
      permissionType,
      origin,
      chainId: normalizedRequest.chainId,
      permission: normalizedRequest.permission,
    });

    if (introResult?.isCancelled) {
      return {
        isApproved: false,
        reason: 'Permission request denied at introduction screen',
      };
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
      context = await lifecycleHandlers.buildContext(normalizedRequest);
    } catch (error) {
      await confirmationDialog.closeWithError(error as Error);
      throw error;
    }

    const decisionPromise =
      confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();

    let lastUpdateConfirmationPromise: Promise<void> = Promise.resolve();

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
          await existingPermissionsCoordinator.getStatus();

        const grantDisabled = isGrantDisabled || hasValidationErrors(metadata);

        const { scanDappUrlResult, scanAddressResult } =
          trustSignalsCoordinator.getResults();

        if (context.showExistingPermissions) {
          const enteringSubview = !existingPermissionsSubviewActive;
          if (enteringSubview) {
            // Set synchronously before awaits so eslint require-atomic-updates is satisfied;
            // runUpdate calls are serialized via lastUpdateConfirmationPromise.
            existingPermissionsSubviewActive = true;
          }

          await existingPermissionsCoordinator.maybeShowSubview({
            dialogInterface,
            context,
            enteringSubview,
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

    // no need to execute the update handler if the results have already settled, as we immediately
    // call updateConfirmation below.
    trustSignalsCoordinator.onUpdate(() => {
      updateConfirmation({
        isGrantDisabled: false,
      }).catch((error: unknown) => {
        logger.debug('ConfirmationSession: trust signal UI update failed', {
          origin,
          error: error instanceof Error ? error.message : error,
        });
      });
    });

    try {
      await updateConfirmation({
        isGrantDisabled: false,
      });

      await this.#snapsMetricsService.trackPermissionDialogShown({
        origin,
        permissionType,
        chainId: normalizedRequest.chainId,
        permissionData: normalizedRequest.permission.data,
        justification: context.justification,
      });
    } catch (error) {
      await confirmationDialog.closeWithError(error as Error);
      throw error;
    }

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
      const { isApproved } = await decisionPromise;

      if (isApproved) {
        try {
          const { address } = parseCaipAccountId(context.accountAddressCaip10);
          const upgradeStatus =
            await this.#accountController.getAccountUpgradeStatus({
              account: address,
              chainId: numberToHex(chainId),
            });

          if (!upgradeStatus.isUpgraded) {
            let upgradeSuccess = false;
            try {
              await this.#accountController.upgradeAccount({
                account: address,
                chainId: numberToHex(chainId),
              });
              upgradeSuccess = true;
            } finally {
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

        return {
          isApproved: true,
          context,
        };
      }

      await this.#snapsMetricsService.trackPermissionRejected({
        origin,
        permissionType,
        chainId: normalizedRequest.chainId,
        permissionData: normalizedRequest.permission.data,
        justification: context.justification,
      });

      return {
        isApproved: false,
        reason: 'Permission request denied at confirmation screen',
      };
    } catch (error) {
      await confirmationDialog.closeWithError(error as Error);
      throw error;
    } finally {
      if (lifecycleHandlers.onConfirmationResolved) {
        lifecycleHandlers.onConfirmationResolved();
      }
    }
  }

  /**
   * Shows the first-time introduction screen when needed.
   *
   * @param args - Dialog interface and permission metadata for the intro flow.
   * @param args.dialogInterface - Shared dialog interface for the request.
   * @param args.permissionType - Descriptor name of the permission type.
   * @param args.origin - Site origin for the permission request.
   * @param args.chainId - Chain ID for rejection metrics.
   * @param args.permission - Permission object for rejection metrics.
   * @returns `null` when intro is skipped; otherwise whether the user cancelled.
   */
  async #runIntroductionIfNeeded(args: {
    dialogInterface: DialogInterface;
    permissionType: string;
    origin: string;
    chainId: Hex;
    permission: Permission;
  }): Promise<{ isCancelled: boolean } | null> {
    const { dialogInterface, permissionType, origin, chainId, permission } =
      args;

    const shouldShowIntroduction =
      await this.#permissionIntroductionService.shouldShowIntroduction(
        permissionType,
      );

    if (!shouldShowIntroduction) {
      return null;
    }

    const { isCancelled } =
      await this.#permissionIntroductionService.showIntroduction({
        dialogInterface,
        permissionType,
      });

    if (isCancelled) {
      await this.#snapsMetricsService.trackPermissionRejected({
        origin,
        permissionType,
        chainId,
        permissionData: permission.data,
      });

      return { isCancelled: true };
    }

    await this.#permissionIntroductionService.markIntroductionAsSeen(
      permissionType,
    );

    return { isCancelled: false };
  }
}
