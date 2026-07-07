import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';

import type { PermissionGrantPipeline } from './PermissionGrantPipeline';
import type {
  BaseContext,
  BaseMetadata,
  DeepRequired,
  LifecycleOrchestrationHandlers,
  PermissionRequestResult,
} from './types';

/**
 * Orchestrator for the permission request lifecycle.
 * Delegates to {@link PermissionGrantPipeline}; retained until Stage 8 cleanup.
 */
export class PermissionRequestLifecycleOrchestrator {
  readonly #pipeline: PermissionGrantPipeline;

  constructor({ pipeline }: { pipeline: PermissionGrantPipeline }) {
    this.#pipeline = pipeline;
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
    return await this.#pipeline.run({
      origin,
      permissionRequest,
      lifecycleHandlers,
    });
  }
}
