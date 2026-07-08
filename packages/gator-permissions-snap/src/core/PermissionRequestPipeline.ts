import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';

import type { ConfirmationSession } from './confirmation/ConfirmationSession';
import type { GrantedPermissionResolutionService } from './grant/GrantedPermissionResolutionService';
import type { PermissionRequestLifecycleHandlers } from './permission/PermissionRequestLifecycleHandlers';
import type { PermissionRequestPreparator } from './PermissionRequestPreparator';
import type {
  BaseContext,
  BaseMetadata,
  DeepRequired,
  PermissionRequestResult,
} from './types';

/**
 * Sequences request preparation, confirmation session, and grant resolution
 * for a single permission request.
 */
export class PermissionRequestPipeline {
  readonly #permissionRequestPreparator: PermissionRequestPreparator;

  readonly #confirmationSession: ConfirmationSession;

  readonly #grantedPermissionResolutionService: GrantedPermissionResolutionService;

  constructor({
    permissionRequestPreparator,
    confirmationSession,
    grantedPermissionResolutionService,
  }: {
    permissionRequestPreparator: PermissionRequestPreparator;
    confirmationSession: ConfirmationSession;
    grantedPermissionResolutionService: GrantedPermissionResolutionService;
  }) {
    this.#permissionRequestPreparator = permissionRequestPreparator;
    this.#confirmationSession = confirmationSession;
    this.#grantedPermissionResolutionService =
      grantedPermissionResolutionService;
  }

  /**
   * Runs the full permission request pipeline for one request.
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
    lifecycleHandlers: PermissionRequestLifecycleHandlers<
      TRequest,
      TContext,
      TMetadata,
      TPermission,
      TPopulatedPermission
    >;
  }): Promise<PermissionRequestResult> {
    const { origin, permissionRequest, lifecycleHandlers } = args;

    const preparationResult = await this.#permissionRequestPreparator.prepare({
      origin,
      permissionRequest,
      parseAndValidate: lifecycleHandlers.parseAndValidatePermission,
    });

    if (!preparationResult.ok) {
      return {
        isApproved: false,
        reason: preparationResult.reason,
      };
    }

    const { normalizedRequest, chainId, permissionType } = preparationResult;

    const sessionResult = await this.#confirmationSession.run({
      origin,
      permissionType,
      normalizedRequest,
      chainId,
      lifecycleHandlers,
    });

    if (!sessionResult.isApproved) {
      return {
        isApproved: false,
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
      isApproved: true,
      response,
    };
  }
}
