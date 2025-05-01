import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';
import type { NativeTokenStreamPermissionRequest } from 'src/permissions/nativeTokenStream/types';

import type { AccountController } from '../accountController';
import { NativeTokenStreamOrchestrator } from '../permissions/nativeTokenStream/orchestrator';
import type { TokenPricesService } from '../services/tokenPricesService';
import type { UserEventDispatcher } from '../userEventDispatcher';
import type { ConfirmationDialogFactory } from './confirmation/factory';
import type { Orchestrator } from './orchestrator';

/**
 * Factory for creating permission-specific orchestrators.
 * Each permission type has its own orchestrator that handles the specific logic for that permission.
 */
export class OrchestratorFactory {
  readonly #accountController: AccountController;

  readonly #tokenPricesService: TokenPricesService;

  readonly #confirmationDialogFactory: ConfirmationDialogFactory;

  readonly #userEventDispatcher: UserEventDispatcher;

  constructor({
    accountController,
    tokenPricesService,
    confirmationDialogFactory,
    userEventDispatcher,
  }: {
    accountController: AccountController;
    tokenPricesService: TokenPricesService;
    confirmationDialogFactory: ConfirmationDialogFactory;
    userEventDispatcher: UserEventDispatcher;
  }) {
    this.#accountController = accountController;
    this.#tokenPricesService = tokenPricesService;
    this.#confirmationDialogFactory = confirmationDialogFactory;
    this.#userEventDispatcher = userEventDispatcher;
  }

  /**
   * Creates an orchestrator for the specified permission type.
   * @param permissionRequest - The permission request object containing the type and details of the permission to create an orchestrator for.
   * @returns The permission orchestrator.
   * @throws If the permission type is not supported.
   */
  createOrchestrator(permissionRequest: PermissionRequest): Orchestrator {
    const type = extractPermissionName(permissionRequest.permission.type);

    const baseDependencies = {
      permissionRequest:
        permissionRequest as NativeTokenStreamPermissionRequest,
      accountController: this.#accountController,
      confirmationDialogFactory: this.#confirmationDialogFactory,
      userEventDispatcher: this.#userEventDispatcher,
    };

    switch (type) {
      case 'native-token-stream':
        return new NativeTokenStreamOrchestrator({
          ...baseDependencies,
          tokenPricesService: this.#tokenPricesService,
        });
      default:
        throw new Error(`Unsupported permission type: ${type}`);
    }
  }
}
