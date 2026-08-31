import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';

import type { UserEventDispatcher } from '../../userEventDispatcher';
import type { AccountController } from '../accountController';
import { ConfirmationShell } from '../confirmation/ConfirmationShell';
import type { BaseContext, BaseMetadata } from '../types';
import type { PermissionModule } from './PermissionModule';
import type { TokenMetadataCoordinator } from '../coordinators/TokenMetadataCoordinator';

/**
 * Creates a {@link ConfirmationShell} per permission request.
 */
export class ConfirmationShellFactory {
  readonly #accountController: AccountController;

  readonly #userEventDispatcher: UserEventDispatcher;

  constructor({
    accountController,
    userEventDispatcher,
  }: {
    accountController: AccountController;
    userEventDispatcher: UserEventDispatcher;
  }) {
    this.#accountController = accountController;
    this.#userEventDispatcher = userEventDispatcher;
  }

  /**
   * Creates a confirmation shell wired to the given module and request.
   * @param args - Module metadata, coordinator, and the in-flight permission request.
   * @param args.module - Registered permission module for the request type.
   * @param args.permissionRequest - Raw permission request from the RPC handler.
   * @param args.tokenMetadataCoordinator - Token metadata coordinator for the request.
   * @returns A shell instance for the grant confirmation UI.
   */
  create<TContext extends BaseContext, TMetadata extends BaseMetadata>(args: {
    module: PermissionModule<PermissionRequest, TContext, TMetadata>;
    permissionRequest: PermissionRequest;
    tokenMetadataCoordinator: TokenMetadataCoordinator;
  }): ConfirmationShell<TContext, TMetadata> {
    const { module, permissionRequest, tokenMetadataCoordinator } = args;

    return new ConfirmationShell({
      accountController: this.#accountController,
      userEventDispatcher: this.#userEventDispatcher,
      title: module.title,
      subtitle: module.subtitle,
      permissionRequest,
      shellTokenCaip19s: module.shellTokenCaip19s ?? module.tokenCaip19s,
      balanceTokenCaip19: module.balanceTokenCaip19,
      tokenMetadataCoordinator,
      renderBody: async (renderArgs) => module.renderBody(renderArgs),
    });
  }
}
