import type {
  Permission,
  PermissionRequest,
} from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { numberToHex, parseCaipAccountId } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type {
  FetchAddressScanResult,
  ScanDappUrlResult,
  TrustSignalsClient,
} from '../../clients/trustSignalsClient';
import type { SnapsMetricsService } from '../../services/snapsMetricsService';
import type { AccountController } from '../accountController';
import { ConfirmationDialog } from '../confirmation';
import type { ConfirmationDialogFactory } from '../confirmationFactory';
import { ExistingPermissionsCoordinator } from '../coordinators/ExistingPermissionsCoordinator';
import { TrustSignalsCoordinator } from '../coordinators/TrustSignalsCoordinator';
import type { DialogInterface } from '../dialogInterface';
import type { DialogInterfaceFactory } from '../dialogInterfaceFactory';
import type { ExistingPermissionsService } from '../existingpermissions';
import type { ExistingPermissionsState } from '../existingpermissions/existingPermissionsState';
import type { PermissionRequestLifecycleHandlers } from '../permission/PermissionRequestLifecycleHandlers';
import type { PermissionIntroductionService } from '../permissionIntroduction';
import type { BaseContext, BaseMetadata, DeepRequired } from '../types';

/**
 * Which confirmation surface is active for the session.
 */
type ConfirmationView =
  | 'main'
  | 'enteringExistingPermissions'
  | 'existingPermissions';

/**
 * UI and permission state for a single confirmation session.
 */
type ConfirmationSessionState<TContext extends BaseContext> = {
  context: TContext;
  isGrantDisabled: boolean;
  view: ConfirmationView;
};

/**
 * Partial updates applied before re-rendering the confirmation dialog.
 */
type ConfirmationSessionStateUpdate<TContext extends BaseContext> = Partial<
  Pick<
    ConfirmationSessionState<TContext>,
    'context' | 'isGrantDisabled' | 'view'
  >
>;

/**
 * Update request for {@link ConfirmationSession}'s serialized render pipeline.
 * `showExistingPermissions` is resolved against the latest session state when the
 * update runs, not when the caller enqueues it.
 */
type ConfirmationSessionUpdateRequest<TContext extends BaseContext> =
  ConfirmationSessionStateUpdate<TContext> & {
    showExistingPermissions?: boolean;
  };

/**
 * Lifecycle callbacks used by {@link ConfirmationSession.#renderConfirmation}.
 */
type ConfirmationRenderLifecycleHandlers<
  TContext extends BaseContext,
  TMetadata extends BaseMetadata,
> = {
  deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;
  createConfirmationContent: (args: {
    context: TContext;
    metadata: TMetadata;
    origin: string;
    chainId: number;
    scanDappUrlResult: ScanDappUrlResult | null;
    scanAddressResult: FetchAddressScanResult | null;
    existingPermissionsStatus: ExistingPermissionsState;
    isGrantDisabled: boolean;
  }) => Promise<SnapElement>;
};

/**
 * Per-request dependencies passed into {@link ConfirmationSession.#renderConfirmation}.
 */
type ConfirmationRenderContext<
  TContext extends BaseContext,
  TMetadata extends BaseMetadata,
> = {
  state: ConfirmationSessionState<TContext>;
  lifecycleHandlers: ConfirmationRenderLifecycleHandlers<TContext, TMetadata>;
  existingPermissionsCoordinator: ExistingPermissionsCoordinator;
  trustSignalsCoordinator: TrustSignalsCoordinator;
  dialogInterface: DialogInterface;
  confirmationDialog: ConfirmationDialog;
  origin: string;
  chainId: number;
  hasValidationErrors: (metadata: TMetadata) => boolean;
};

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
   * Returns session state with a partial update applied.
   * @param state - Current session state for the request.
   * @param update - Fields to merge into the returned state.
   * @returns Updated session state.
   */
  #applyStateUpdate<TContext extends BaseContext>(
    state: ConfirmationSessionState<TContext>,
    update: ConfirmationSessionStateUpdate<TContext>,
  ): ConfirmationSessionState<TContext> {
    return {
      ...state,
      ...(update.context !== undefined && { context: update.context }),
      ...(update.isGrantDisabled !== undefined && {
        isGrantDisabled: update.isGrantDisabled,
      }),
      ...(update.view !== undefined && { view: update.view }),
    };
  }

  /**
   * Resolves navigation intent and explicit field updates against session state.
   * @param currentState - Session state at the start of this serialized update.
   * @param update - Partial update and optional existing-permissions navigation.
   * @returns Fields to merge before rendering.
   */
  #resolveStateUpdate<TContext extends BaseContext>(
    currentState: ConfirmationSessionState<TContext>,
    update: ConfirmationSessionUpdateRequest<TContext>,
  ): ConfirmationSessionStateUpdate<TContext> {
    const { showExistingPermissions, ...stateUpdate } = update;

    if (showExistingPermissions === undefined) {
      return stateUpdate;
    }

    let view: ConfirmationView = 'main';
    if (showExistingPermissions) {
      view =
        currentState.view === 'main'
          ? 'enteringExistingPermissions'
          : 'existingPermissions';
    }

    return {
      ...stateUpdate,
      view,
    };
  }

  /**
   * Re-renders the confirmation dialog from the current session state.
   * @param context - Per-request render dependencies and state.
   * @returns The view state after rendering.
   */
  async #renderConfirmation<
    TContext extends BaseContext,
    TMetadata extends BaseMetadata,
  >(
    context: ConfirmationRenderContext<TContext, TMetadata>,
  ): Promise<ConfirmationView> {
    const {
      state,
      lifecycleHandlers,
      existingPermissionsCoordinator,
      trustSignalsCoordinator,
      dialogInterface,
      confirmationDialog,
      origin,
      chainId,
      hasValidationErrors,
    } = context;

    const metadata = await lifecycleHandlers.deriveMetadata({
      context: state.context,
    });

    const existingPermissionsStatus =
      await existingPermissionsCoordinator.getStatus();

    const grantDisabled =
      state.isGrantDisabled || hasValidationErrors(metadata);

    const { scanDappUrlResult, scanAddressResult } =
      trustSignalsCoordinator.getResults();

    if (state.view === 'enteringExistingPermissions') {
      await existingPermissionsCoordinator.showSubview({
        dialogInterface,
      });

      // within this function, the view only changes when transitioning from 'enteringExistingPermissions' to 'existingPermissions'
      return 'existingPermissions';
    }

    if (state.view === 'main') {
      const ui = await lifecycleHandlers.createConfirmationContent({
        context: state.context,
        metadata,
        origin,
        chainId,
        scanDappUrlResult,
        scanAddressResult,
        existingPermissionsStatus,
        isGrantDisabled: grantDisabled,
      });

      await confirmationDialog.updateContent({ ui });
    }

    return state.view;
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

    const hasValidationErrors = (metadata: TMetadata): boolean => {
      return Object.values(metadata?.validationErrors ?? {}).some(
        (message) => typeof message === 'string',
      );
    };

    let state: ConfirmationSessionState<TContext>;

    // Validation callback that runs when grant button is clicked.
    // Race condition scenario this prevents:
    //   1. User types invalid input → validation debounced (500ms delay)
    //   2. User clicks Grant before 500ms elapses (button still enabled)
    //   3. Button click event flushes all pending debounced events
    //   4. Validation runs → updates UI with errors & disables button
    //   5. Button handler already invoked (button was enabled at click time)
    //   6. This callback catches it → returns false → dialog stays open
    const onBeforeGrant = async (): Promise<boolean> => {
      const metadata = await lifecycleHandlers.deriveMetadata({
        context: state.context,
      });
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
      state = {
        context: await lifecycleHandlers.buildContext(normalizedRequest),
        isGrantDisabled: false,
        view: 'main',
      };
    } catch (error) {
      await confirmationDialog.closeWithError(error as Error);
      throw error;
    }

    const decisionPromise =
      confirmationDialog.displayConfirmationDialogAndAwaitUserDecision();

    let lastRenderPromise: Promise<void> = Promise.resolve();

    const updateConfirmation = async (
      update: ConfirmationSessionUpdateRequest<TContext> = {},
    ): Promise<void> => {
      const runUpdate = async (): Promise<void> => {
        const previousState = state;
        let nextState = previousState;
        try {
          const resolvedUpdate = this.#resolveStateUpdate(
            previousState,
            update,
          );
          const updatedState = this.#applyStateUpdate(
            previousState,
            resolvedUpdate,
          );

          const view = await this.#renderConfirmation({
            state: updatedState,
            lifecycleHandlers,
            existingPermissionsCoordinator,
            trustSignalsCoordinator,
            dialogInterface,
            confirmationDialog,
            origin,
            chainId,
            hasValidationErrors,
          });

          nextState = this.#applyStateUpdate(updatedState, { view });
        } catch (error) {
          nextState = previousState;
          logger.debug('ConfirmationSession: render update failed', {
            origin,
            error: error instanceof Error ? error.message : error,
          });
          throw error;
        } finally {
          // Updates are serialized via lastRenderPromise; previousState is the authoritative pre-await snapshot.
          // eslint-disable-next-line require-atomic-updates -- see lastRenderPromise comment below
          state = nextState;
        }
      };

      // Serialize confirmation renders so concurrent updates (trust signals, context
      // edits, subview navigation) never interleave. Each runUpdate snapshots `state`
      // as previousState at entry; that is only safe because lastRenderPromise
      // guarantees the prior update finished and assigned `state`. On failure, roll
      // back to previousState so UI and session state stay aligned, then rethrow.
      // The leading .catch() keeps the queue alive after a rejected step so later
      // updates still run (trust-signal callers swallow errors locally).
      lastRenderPromise = lastRenderPromise
        .catch(() => undefined)
        .then(runUpdate);

      await lastRenderPromise;
    };

    trustSignalsCoordinator.onUpdate(() => {
      updateConfirmation().catch(() => undefined);
    });

    try {
      await updateConfirmation();

      await this.#snapsMetricsService.trackPermissionDialogShown({
        origin,
        permissionType,
        chainId: normalizedRequest.chainId,
        permissionData: normalizedRequest.permission.data,
        justification: state.context.justification,
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
          await updateConfirmation({ context: updatedContext });
        } catch (error) {
          await confirmationDialog.closeWithError(error as Error);
          throw error;
        }
      };

      const onExistingPermissionsViewChange = async (
        show: boolean,
      ): Promise<void> => {
        try {
          await updateConfirmation({ showExistingPermissions: show });
        } catch (error) {
          await confirmationDialog.closeWithError(error as Error);
          throw error;
        }
      };

      lifecycleHandlers.onConfirmationCreated({
        interfaceId,
        updateContext,
        onExistingPermissionsViewChange,
        initialContext: state.context,
      });
    }

    try {
      const { isApproved } = await decisionPromise;

      if (isApproved) {
        try {
          const { address } = parseCaipAccountId(
            state.context.accountAddressCaip10,
          );
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
          context: state.context,
        };
      }

      await this.#snapsMetricsService.trackPermissionRejected({
        origin,
        permissionType,
        chainId: normalizedRequest.chainId,
        permissionData: normalizedRequest.permission.data,
        justification: state.context.justification,
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
