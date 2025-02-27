import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  Json,
  OnInstallHandler,
  OnUpdateHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import {
  UserInputEventType,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import { sepolia } from 'viem/chains';

import { AccountController } from './accountController';
import { createPermissionOrchestratorFactory } from './orchestrators';
import { hasPermission, InternalMethod } from './permissions';
import { permissionConfirmationPageFactory } from './ui';
import {
  buttonClickEventHandler,
  getActiveInterfaceContext,
  validatePermissionRequestParam,
} from './utils';

// Initialize account controller for future use
const controller = new AccountController({
  snapsProvider: snap,
  supportedChains: [sepolia],
  deploymentSalt: '0x',
});

// If the account controller is not used, linting error is surfaced.
if (controller === undefined) {
  throw new Error('Failed to initialize account controller');
}

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of the request.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  logger.info(
    `Custom request (origin="${origin}"):`,
    JSON.stringify(request, undefined, 2),
  );

  if (!hasPermission(origin, request.method)) {
    throw new Error(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }

  switch (request.method) {
    case InternalMethod.PermissionProviderGrantAttenuatedPermissions: {
      const { permissionsRequest, siteOrigin } = validatePermissionRequestParam(
        request.params,
      );

      const permissionRequest = permissionsRequest[0];
      if (!permissionRequest) {
        throw new Error('No permissions provided');
      }

      // Testing orchestrator e2e
      const orchestrator = createPermissionOrchestratorFactory(
        permissionRequest,
        snap,
        controller,
      );

      if (await orchestrator.validate(permissionRequest)) {
        const permision = permissionRequest.permission;

        const res = await orchestrator.orchestrate(permision as any, {
          chainId: permissionRequest.chainId,
          delegate: permissionRequest.signer.data.address,
          origin: siteOrigin,
          expiry: permissionRequest.expiry,
        });

        return [res] as Json[];
      }

      return null;
    }
    default: {
      throw new Error(request.method);
    }
  }
};

/**
 * OnInstall is called when the snap installs and it used to offer its cryptographic abilities as permissions to the kernel snap.
 */
export const onInstall: OnInstallHandler = async () => {
  //
};

/**
 * OnUpdate is called when the snap version updates and it used to update cryptographic abilities as permissions its to the kernel snap.
 */
export const onUpdate: OnUpdateHandler = async () => {
  //
};

/**
 * Handle incoming user input events to update the interface.
 *
 * @param args - The user input handler args as object.
 * @param args.id - The id of the interface.
 * @param args.event - The user input event.
 */
export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
  const { activeInterfaceId, activeContext } =
    await getActiveInterfaceContext();
  if (id === activeInterfaceId && activeContext) {
    switch (event.type) {
      case UserInputEventType.ButtonClickEvent: {
        await buttonClickEventHandler(event, activeInterfaceId);
        break;
      }
      default: {
        return;
      }
    }

    // TODO: Make sure context is correct type for the permission type instead of any
    const { permission, delegator, delegate, siteOrigin, balance, expiry } =
      activeContext as any;

    const [updatedContext, permissionConfirmationPage] =
      permissionConfirmationPageFactory({
        permission,
        delegator,
        delegate,
        siteOrigin,
        balance,
        expiry,
      });

    await snap.request({
      method: 'snap_updateInterface',
      params: {
        id,
        context: updatedContext,
        ui: permissionConfirmationPage,
      },
    });
  }
};
