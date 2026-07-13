import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';

import type { TokenMetadataService } from '../../services/tokenMetadataService';
import type { TokenPricesService } from '../../services/tokenPricesService';
import type { UserEventDispatcher } from '../../userEventDispatcher';
import type { AccountController } from '../accountController';
import { ConfirmationShell } from '../confirmation/ConfirmationShell';
import type { BaseContext, BaseMetadata } from '../types';
import type { PermissionModule } from './PermissionModule';

/**
 * Creates a {@link ConfirmationShell} per permission request.
 */
export class ConfirmationShellFactory {
  readonly #accountController: AccountController;

  readonly #userEventDispatcher: UserEventDispatcher;

  readonly #tokenMetadataService: TokenMetadataService;

  readonly #tokenPricesService: TokenPricesService;

  constructor({
    accountController,
    userEventDispatcher,
    tokenMetadataService,
    tokenPricesService,
  }: {
    accountController: AccountController;
    userEventDispatcher: UserEventDispatcher;
    tokenMetadataService: TokenMetadataService;
    tokenPricesService: TokenPricesService;
  }) {
    this.#accountController = accountController;
    this.#userEventDispatcher = userEventDispatcher;
    this.#tokenMetadataService = tokenMetadataService;
    this.#tokenPricesService = tokenPricesService;
  }

  /**
   * Creates a confirmation shell wired to the given module and request.
   * @param args - Module metadata and the in-flight permission request.
   * @param args.module - Registered permission module for the request type.
   * @param args.permissionRequest - Raw permission request from the RPC handler.
   * @returns A shell instance for the grant confirmation UI.
   */
  create<TContext extends BaseContext, TMetadata extends BaseMetadata>(args: {
    module: PermissionModule<PermissionRequest, TContext, TMetadata>;
    permissionRequest: PermissionRequest;
  }): ConfirmationShell<TContext, TMetadata> {
    const { module, permissionRequest } = args;

    return new ConfirmationShell({
      accountController: this.#accountController,
      userEventDispatcher: this.#userEventDispatcher,
      tokenMetadataService: this.#tokenMetadataService,
      tokenPricesService: this.#tokenPricesService,
      title: module.title,
      subtitle: module.subtitle,
      permissionRequest,
      showTokenBalance: module.showTokenBalance ?? true,
      renderBody: async (renderArgs) => module.renderBody(renderArgs),
    });
  }
}
