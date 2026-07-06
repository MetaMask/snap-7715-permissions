import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import {
  extractDescriptorName,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';
import { hexToNumber } from '@metamask/utils';

import { getChainMetadata } from './chainMetadata';
import type { ConfirmationSession } from './confirmation/ConfirmationSession';
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
  readonly #snapsMetricsService: SnapsMetricsService;

  readonly #permissionIntroductionService: PermissionIntroductionService;

  readonly #confirmationSession: ConfirmationSession;

  readonly #grantedPermissionResolutionService: GrantedPermissionResolutionService;

  constructor({
    snapsMetricsService,
    permissionIntroductionService,
    confirmationSession,
    grantedPermissionResolutionService,
  }: {
    snapsMetricsService: SnapsMetricsService;
    permissionIntroductionService: PermissionIntroductionService;
    confirmationSession: ConfirmationSession;
    grantedPermissionResolutionService: GrantedPermissionResolutionService;
  }) {
    this.#snapsMetricsService = snapsMetricsService;
    this.#permissionIntroductionService = permissionIntroductionService;
    this.#confirmationSession = confirmationSession;
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

    await this.#snapsMetricsService.trackPermissionRequestStarted({
      origin,
      permissionType,
      chainId: permissionRequest.chainId,
      permissionData: permissionRequest.permission.data,
    });

    const validatedPermissionRequest =
      lifecycleHandlers.parseAndValidatePermission(permissionRequest);
    const normalizedPermissionRequest =
      normalizePermissionRequestWithSentinelRedeemerRule({
        origin,
        permissionRequest: validatedPermissionRequest,
        chainId,
      });

    const shouldShowIntroduction =
      await this.#permissionIntroductionService.shouldShowIntroduction(
        permissionType,
      );

    const sessionResult = await this.#confirmationSession.run({
      origin,
      permissionType,
      normalizedRequest: normalizedPermissionRequest,
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
      originalRequest: normalizedPermissionRequest,
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
