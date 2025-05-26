import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';

import type { AccountController } from '../accountController';
import { createNativeTokenStreamHandler } from '../permissions/nativeTokenStream/createHandler';
import type { NativeTokenStreamPermissionRequest } from '../permissions/nativeTokenStream/types';
import type { PermissionHandlerType } from '../permissions/types';
import type { TokenPricesService } from '../services/tokenPricesService';
import type { UserEventDispatcher } from '../userEventDispatcher';
import type { ConfirmationDialogFactory } from './confirmationFactory';
import type { PermissionRequestLifecycleOrchestrator } from './permissionRequestLifecycleOrchestrator';

/**
 * Factory for creating permission-specific orchestrators.
 * Each permission type has its own orchestrator that handles the specific logic for that permission.
 */
export class PermissionHandlerFactory {
  readonly #accountController: AccountController;

  readonly #tokenPricesService: TokenPricesService;

  readonly #confirmationDialogFactory: ConfirmationDialogFactory;

  readonly #userEventDispatcher: UserEventDispatcher;

  readonly #orchestrator: PermissionRequestLifecycleOrchestrator;

  constructor({
    accountController,
    tokenPricesService,
    confirmationDialogFactory,
    userEventDispatcher,
    orchestrator,
  }: {
    accountController: AccountController;
    tokenPricesService: TokenPricesService;
    confirmationDialogFactory: ConfirmationDialogFactory;
    userEventDispatcher: UserEventDispatcher;
    orchestrator: PermissionRequestLifecycleOrchestrator;
  }) {
    this.#accountController = accountController;
    this.#tokenPricesService = tokenPricesService;
    this.#confirmationDialogFactory = confirmationDialogFactory;
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

    const baseDependencies = {
      permissionRequest:
        permissionRequest as NativeTokenStreamPermissionRequest,
      accountController: this.#accountController,
      confirmationDialogFactory: this.#confirmationDialogFactory,
      userEventDispatcher: this.#userEventDispatcher,
      orchestrator: this.#orchestrator,
    };

    switch (type) {
      case 'native-token-stream':
        return createNativeTokenStreamHandler({
          ...baseDependencies,
          tokenPricesService: this.#tokenPricesService,
        });
      default:
        throw new Error(`Unsupported permission type: ${type}`);
    }
  }
}
