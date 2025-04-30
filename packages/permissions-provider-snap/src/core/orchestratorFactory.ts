import type { AccountController } from '../accountController';
import type { TokenPricesService } from '../services/tokenPricesService';
import type { ConfirmationDialogFactory } from './confirmation/factory';
import type { UserEventDispatcher } from '../userEventDispatcher';
import { NativeTokenStreamOrchestrator } from '../permissions/nativeTokenStream/orchestrator';
import { BaseOrchestrator } from './orchestrator';
import { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { NativeTokenStreamPermissionRequest } from 'src/permissions/nativeTokenStream/types';
import { extractPermissionName } from '@metamask/7715-permissions-shared/utils';

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
   * @param type - The type of permission to create an orchestrator for.
   * @returns The permission orchestrator.
   * @throws If the permission type is not supported.
   */
  createOrchestrator(permissionRequest: PermissionRequest): BaseOrchestrator {
    const type = extractPermissionName(permissionRequest.permission.type);

    switch (type) {
      case 'native-token-stream':
        return new NativeTokenStreamOrchestrator({
          permissionRequest:
            permissionRequest as NativeTokenStreamPermissionRequest,
          accountController: this.#accountController,
          tokenPricesService: this.#tokenPricesService,
          confirmationDialogFactory: this.#confirmationDialogFactory,
          userEventDispatcher: this.#userEventDispatcher,
        }) as any as BaseOrchestrator; // todo: NativeTokenstreamOrchestrator should fulfil the requirement of BaseOrchestrator type
      default:
        throw new Error(`Unsupported permission type: ${type}`);
    }
  }
}
