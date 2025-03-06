import {
  extractPermissionName,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import type {
  Json,
  OnInstallHandler,
  OnUpdateHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import {
  SnapError,
  UserInputEventType,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';
import { sepolia } from 'viem/chains';

import { AccountController } from './accountController';
import { createMockAccountController } from './accountController.mock';
import type { SupportedPermissionTypes } from './orchestrators';
import { createPermissionOrchestrator } from './orchestrators';
import { hasPermission, InternalMethod } from './permissions';
import {
  buttonClickEventHandler,
  getActiveInterfaceContext,
  createPermissionConfirmationRenderHandler,
} from './ui';
import { isSnapRpcError, validatePermissionRequestParam } from './utils';

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

// Initialize permission confirmation render handler
const confirmationRenderHandler =
  createPermissionConfirmationRenderHandler(snap);

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
      try {
        const { permissionsRequest, siteOrigin } =
          validatePermissionRequestParam(request.params);

        const firstRequest = permissionsRequest[0];
        if (!firstRequest) {
          throw new Error('No permission request found');
        }

        const permissionType = extractPermissionName(
          firstRequest.permission.type,
        ) as SupportedPermissionTypes;

        // process the request
        const orchestrator = createPermissionOrchestrator(
          createMockAccountController(),
          confirmationRenderHandler,
          permissionType,
        );
        const permission = await orchestrator.parseAndValidate(
          firstRequest.permission,
        );

        const res = await orchestrator.orchestrate({
          permission,
          chainId: firstRequest.chainId,
          sessionAccount: firstRequest.signer.data.address,
          origin: siteOrigin,
          expiry: firstRequest.expiry,
        });

        if (!res.success) {
          throw new Error(res.reason);
        }

        return [res.response] as Json[];
      } catch (error: any) {
        let snapError = error;

        if (!isSnapRpcError(error)) {
          snapError = new SnapError(error);
        }
        logger.error(
          `onRpcRequest error: ${JSON.stringify(snapError.toJSON(), null, 2)}`,
        );
        throw snapError;
      }
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
  const activeContext = await getActiveInterfaceContext(id);
  if (activeContext) {
    switch (event.type) {
      case UserInputEventType.ButtonClickEvent: {
        await buttonClickEventHandler(event, id);
        break;
      }
      default: {
        return;
      }
    }

    // Update the interface with the new context and UI specific to the permission type
    const [updatedContext, permissionConfirmationPage] =
      confirmationRenderHandler.getPermissionConfirmationPage(
        {
          permission: activeContext.permission,
          account: activeContext.account,
          siteOrigin: activeContext.siteOrigin,
          balance: activeContext.balance,
          expiry: activeContext.expiry,
          chainId: activeContext.chainId,
          delegation: activeContext.delegation,
        },
        extractPermissionName(
          activeContext.permission.type,
        ) as SupportedPermissionTypes,
      );

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
