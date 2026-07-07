import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';

import type { ConfirmationSession } from './confirmation/ConfirmationSession';
import type { GrantedPermissionResolutionService } from './grant/GrantedPermissionResolutionService';
import type { PermissionGrantPreparator } from './PermissionGrantPreparator';
import type { IntroductionPhase } from './phases/IntroductionPhase';
import type {
  BaseContext,
  BaseMetadata,
  DeepRequired,
  LifecycleOrchestrationHandlers,
  PermissionRequestResult,
} from './types';

/**
 * Sequences grant preparation, confirmation session, and grant resolution
 * for a single permission request.
 */
export class PermissionGrantPipeline {
  readonly #permissionGrantPreparator: PermissionGrantPreparator;

  readonly #introductionPhase: IntroductionPhase;

  readonly #confirmationSession: ConfirmationSession;

  readonly #grantedPermissionResolutionService: GrantedPermissionResolutionService;

  constructor({
    permissionGrantPreparator,
    introductionPhase,
    confirmationSession,
    grantedPermissionResolutionService,
  }: {
    permissionGrantPreparator: PermissionGrantPreparator;
    introductionPhase: IntroductionPhase;
    confirmationSession: ConfirmationSession;
    grantedPermissionResolutionService: GrantedPermissionResolutionService;
  }) {
    this.#permissionGrantPreparator = permissionGrantPreparator;
    this.#introductionPhase = introductionPhase;
    this.#confirmationSession = confirmationSession;
    this.#grantedPermissionResolutionService =
      grantedPermissionResolutionService;
  }

  /**
   * Runs the full permission grant pipeline for one request.
   *
   * @param args - Site origin, raw request, and permission-specific lifecycle handlers.
   * @param args.origin - Site origin for the permission request.
   * @param args.permissionRequest - Raw permission request from the RPC handler.
   * @param args.lifecycleHandlers - Permission-specific lifecycle callbacks.
   * @returns Approved response or rejection reason.
   */
  async run<
    TRequest extends PermissionRequest,
    TContext extends BaseContext,
    TMetadata extends BaseMetadata,
    TPermission extends TRequest['permission'],
    TPopulatedPermission extends DeepRequired<TPermission>,
  >(args: {
    origin: string;
    permissionRequest: PermissionRequest;
    lifecycleHandlers: LifecycleOrchestrationHandlers<
      TRequest,
      TContext,
      TMetadata,
      TPermission,
      TPopulatedPermission
    >;
  }): Promise<PermissionRequestResult> {
    const { origin, permissionRequest, lifecycleHandlers } = args;

    const preparationResult = await this.#permissionGrantPreparator.prepare({
      origin,
      permissionRequest,
      parseAndValidate: lifecycleHandlers.parseAndValidatePermission,
    });

    if (!preparationResult.ok) {
      return preparationResult.result;
    }

    const { normalizedRequest, chainId, permissionType } = preparationResult;

    const shouldShowIntroduction =
      await this.#introductionPhase.shouldShow(permissionType);

    const sessionResult = await this.#confirmationSession.run({
      origin,
      permissionType,
      normalizedRequest,
      chainId,
      lifecycleHandlers,
      shouldShowIntroduction,
    });

    if (!sessionResult.isApproved) {
      return {
        approved: false,
        reason: sessionResult.reason,
      };
    }

    const isAdjustmentAllowed =
      permissionRequest.permission.isAdjustmentAllowed ?? true;

    const response = await this.#grantedPermissionResolutionService.resolve({
      originalRequest: normalizedRequest,
      modifiedContext: sessionResult.context,
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
}
