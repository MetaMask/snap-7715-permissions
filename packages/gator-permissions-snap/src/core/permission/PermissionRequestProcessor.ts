import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';

import type { TokenMetadataService } from '../../services/tokenMetadataService';
import type { PermissionGrantPipeline } from '../PermissionGrantPipeline';
import type { PermissionRequestResult } from '../types';
import type { ConfirmationShellFactory } from './ConfirmationShellFactory';
import { buildGrantLifecycleHandlers } from './PermissionModule';
import type { PermissionRegistry } from './PermissionRegistry';

/**
 * Looks up a permission module and runs the grant pipeline for one request.
 */
export class PermissionRequestProcessor {
  readonly #registry: PermissionRegistry;

  readonly #pipeline: PermissionGrantPipeline;

  readonly #confirmationShellFactory: ConfirmationShellFactory;

  readonly #tokenMetadataService: TokenMetadataService;

  constructor({
    registry,
    pipeline,
    confirmationShellFactory,
    tokenMetadataService,
  }: {
    registry: PermissionRegistry;
    pipeline: PermissionGrantPipeline;
    confirmationShellFactory: ConfirmationShellFactory;
    tokenMetadataService: TokenMetadataService;
  }) {
    this.#registry = registry;
    this.#pipeline = pipeline;
    this.#confirmationShellFactory = confirmationShellFactory;
    this.#tokenMetadataService = tokenMetadataService;
  }

  /**
   * Processes a single permission request through the grant pipeline.
   * @param origin - Site origin for the request.
   * @param request - Raw permission request from the RPC handler.
   * @returns Approved response or rejection reason.
   */
  async process(
    origin: string,
    request: PermissionRequest,
  ): Promise<PermissionRequestResult> {
    const type = extractDescriptorName(request.permission.type);
    const module = this.#registry.get(type);
    const confirmationShell = this.#confirmationShellFactory.create({
      module,
      permissionRequest: request,
    });
    const lifecycleHandlers = buildGrantLifecycleHandlers({
      module,
      confirmationShell,
      tokenMetadataService: this.#tokenMetadataService,
    });

    return await this.#pipeline.run({
      origin,
      permissionRequest: request,
      lifecycleHandlers,
    });
  }
}
