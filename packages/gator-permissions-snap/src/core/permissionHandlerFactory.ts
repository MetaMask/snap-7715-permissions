import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';
import { hexToNumber } from '@metamask/utils';

import type { AccountController } from './accountController';
import type { TokenMetadataService } from '../services/tokenMetadataService';
import type { TokenPricesService } from '../services/tokenPricesService';
import type { UserEventDispatcher } from '../userEventDispatcher';
import { PermissionHandler } from './permissionHandler';
import type { PermissionRequestLifecycleOrchestrator } from './permissionRequestLifecycleOrchestrator';
import type {
  BaseContext,
  DeepRequired,
  PermissionDefinition,
  PermissionHandlerType,
} from './types';
import { getPermissionDefinition } from '../permissions/permissionDefinitionsRegistry';
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

  constructor({
    accountController,
    tokenPricesService,
    tokenMetadataService,
    userEventDispatcher,
    orchestrator,
  }: {
    accountController: AccountController;
    tokenPricesService: TokenPricesService;
    tokenMetadataService: TokenMetadataService;
    userEventDispatcher: UserEventDispatcher;
    orchestrator: PermissionRequestLifecycleOrchestrator;
  }) {
    this.#accountController = accountController;
    this.#tokenPricesService = tokenPricesService;
    this.#tokenMetadataService = tokenMetadataService;
    this.#userEventDispatcher = userEventDispatcher;
    this.#orchestrator = orchestrator;
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

    const createPermissionHandler = <
      TRequest extends PermissionRequest,
      TContext extends BaseContext,
      TMetadata extends object,
      TPermission extends TRequest['permission'],
      TPopulatedPermission extends DeepRequired<TPermission>,
    >(
      permissionDefinition: PermissionDefinition<
        TRequest,
        TContext,
        TMetadata,
        TPermission,
        TPopulatedPermission
      >,
    ): PermissionHandlerType => {
      return new PermissionHandler({
        ...permissionDefinition,
        accountController: this.#accountController,
        userEventDispatcher: this.#userEventDispatcher,
        orchestrator: this.#orchestrator,
        permissionRequest,
        tokenPricesService: this.#tokenPricesService,
        tokenMetadataService: this.#tokenMetadataService,
      });
    };

    const permissionDefinition = getPermissionDefinition(type);

    if (!permissionDefinition) {
      throw new InvalidParamsError(
        `Permission definition not found for permission type: ${type}`,
      );
    }

    if (
      !permissionDefinition
        .getSupportedChains()
        .includes(hexToNumber(permissionRequest.chainId))
    ) {
      throw new InvalidParamsError(
        `Unsupported chain ${permissionRequest.chainId} for permission type ${type}`,
      );
    }

    return createPermissionHandler(permissionDefinition);
  }
}
