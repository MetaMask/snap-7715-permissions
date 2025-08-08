import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';

import { erc20TokenPeriodicPermissionDefinition } from '../permissions/erc20TokenPeriodic';
import { erc20TokenStreamPermissionDefinition } from '../permissions/erc20TokenStream';
import { nativeTokenPeriodicPermissionDefinition } from '../permissions/nativeTokenPeriodic';
import { nativeTokenStreamPermissionDefinition } from '../permissions/nativeTokenStream';
import type { TokenMetadataService } from '../services/tokenMetadataService';
import type { TokenPricesService } from '../services/tokenPricesService';
import type { UserEventDispatcher } from '../userEventDispatcher';
import { PermissionHandler } from './permissionHandler';
import type { PermissionRequestLifecycleOrchestrator } from './permissionRequestLifecycleOrchestrator';
import type {
  AccountControllerInterface,
  BaseContext,
  DeepRequired,
  PermissionDefinition,
  PermissionHandlerType,
} from './types';
import { InvalidInputError } from '@metamask/snaps-sdk';

/**
 * Factory for creating permission-specific orchestrators.
 * Each permission type has its own orchestrator that handles the specific logic for that permission.
 */
export class PermissionHandlerFactory {
  readonly #accountController: AccountControllerInterface;

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
    accountController: AccountControllerInterface;
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
    const type = extractPermissionName(permissionRequest.permission.type);

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
    let handler: PermissionHandlerType;

    switch (type) {
      case 'native-token-stream':
        handler = createPermissionHandler(
          nativeTokenStreamPermissionDefinition,
        );
        break;
      case 'native-token-periodic':
        handler = createPermissionHandler(
          nativeTokenPeriodicPermissionDefinition,
        );
        break;
      case 'erc20-token-stream':
        handler = createPermissionHandler(erc20TokenStreamPermissionDefinition);
        break;
      case 'erc20-token-periodic':
        handler = createPermissionHandler(
          erc20TokenPeriodicPermissionDefinition,
        );
        break;
      default:
        throw new InvalidInputError(`Unsupported permission type: ${type}`);
    }

    return handler;
  }
}
