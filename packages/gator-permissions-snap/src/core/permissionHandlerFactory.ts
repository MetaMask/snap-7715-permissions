import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';

import type { AccountController } from './accountController';
import type { PermissionRegistry } from './permission/PermissionRegistry';
import { PermissionHandler } from './permissionHandler';
import type { PermissionRequestLifecycleOrchestrator } from './permissionRequestLifecycleOrchestrator';
import type { PermissionHandlerType } from './types';
import type { TokenMetadataService } from '../services/tokenMetadataService';
import type { TokenPricesService } from '../services/tokenPricesService';
import type { UserEventDispatcher } from '../userEventDispatcher';

/**
 * Factory for creating permission-specific orchestrators.
 * Each permission type has its own orchestrator that handles the specific logic for that permission.
 */
export class PermissionHandlerFactory {
  readonly #accountController: AccountController;

  readonly #tokenPricesService: TokenPricesService;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #userEventDispatcher: UserEventDispatcher;

  readonly #orchestrator: PermissionRequestLifecycleOrchestrator;

  readonly #registry: PermissionRegistry;

  constructor({
    accountController,
    tokenPricesService,
    tokenMetadataService,
    userEventDispatcher,
    orchestrator,
    registry,
  }: {
    accountController: AccountController;
    tokenPricesService: TokenPricesService;
    tokenMetadataService: TokenMetadataService;
    userEventDispatcher: UserEventDispatcher;
    orchestrator: PermissionRequestLifecycleOrchestrator;
    registry: PermissionRegistry;
  }) {
    this.#accountController = accountController;
    this.#tokenPricesService = tokenPricesService;
    this.#tokenMetadataService = tokenMetadataService;
    this.#userEventDispatcher = userEventDispatcher;
    this.#orchestrator = orchestrator;
    this.#registry = registry;
  }

  /**
   * Creates an orchestrator for the specified permission type.
   * @param permissionRequest - The permission request object containing the type and details of the permission to create an orchestrator for.
   * @returns The permission orchestrator.
   * @throws If the permission type is not supported.
   */
  createPermissionHandler(
    permissionRequest: PermissionRequest,
  ): PermissionHandlerType {
    const type = extractDescriptorName(permissionRequest.permission.type);
    const { type: _permissionType, ...permissionDefinition } =
      this.#registry.get(type);

    return new PermissionHandler({
      ...permissionDefinition,
      accountController: this.#accountController,
      userEventDispatcher: this.#userEventDispatcher,
      orchestrator: this.#orchestrator,
      permissionRequest,
      tokenPricesService: this.#tokenPricesService,
      tokenMetadataService: this.#tokenMetadataService,
    });
  }
}
