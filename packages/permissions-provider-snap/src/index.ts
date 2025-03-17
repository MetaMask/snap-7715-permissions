import {
  extractPermissionName,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import {
  UserInputEventType,
  type Json,
  type JsonRpcParams,
  type OnRpcRequestHandler,
  type OnUserInputHandler,
} from '@metamask/snaps-sdk';
import { lineaSepolia, sepolia } from 'viem/chains';

import { AccountController } from './accountController';
import type { SupportedPermissionTypes } from './orchestrators';
import { createPermissionOrchestrator } from './orchestrators';
import { isMethodAllowedForOrigin } from './rpc/permissions';
import { createRpcHandler } from './rpc/rpcHandler';
import { RpcMethod } from './rpc/rpcMethod';
import {
  shouldInterfaceResolveHandler,
  createPermissionConfirmationRenderHandler,
  getActiveInterfaceContext,
} from './ui';

// set up dependencies
const accountController = new AccountController({
  snapsProvider: snap,
  supportedChains: [sepolia, lineaSepolia],
  deploymentSalt: '0x',
});

const permissionConfirmationRenderHandler =
  createPermissionConfirmationRenderHandler(snap);

const rpcHandler = createRpcHandler({
  accountController,
  permissionConfirmationRenderHandler,
});

// configure RPC methods bindings
const boundRpcHandlers: {
  [RpcMethod: string]: (params?: JsonRpcParams) => Promise<Json>;
} = {
  [RpcMethod.PermissionProviderGrantAttenuatedPermissions]:
    rpcHandler.grantPermission.bind(rpcHandler),
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of the request.
 * @throws If the request method is not valid for this snap, or the origin is not allowed to call the method.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  logger.debug(
    `RPC request (origin="${origin}"):`,
    JSON.stringify(request, undefined, 2),
  );

  if (!isMethodAllowedForOrigin(origin, request.method)) {
    throw new Error(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }

  const handler = boundRpcHandlers[request.method];

  if (!handler) {
    throw new Error(`Method ${request.method} not found.`);
  }

  return await handler(request.params);
};

/**
 * Handle incoming user input events.
 *
 * @param args - The user input handler args as object.
 * @param args.id - The id of the interface.
 * @param args.event - The user input event.
 */
export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
  // TODO: Decouple User input handler: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/84
  const activeContext = await getActiveInterfaceContext(id);
  let didInterfaceResolve = false;
  if (activeContext) {
    switch (event.type) {
      case UserInputEventType.ButtonClickEvent: {
        didInterfaceResolve = await shouldInterfaceResolveHandler(
          event,
          id,
          activeContext,
        );
        break;
      }
      default: {
        return;
      }
    }

    // If the interface did not resolve, update the interface with the new context and UI specific to the permission type
    if (!didInterfaceResolve) {
      const permissionType = extractPermissionName(
        activeContext.permission.type,
      ) as SupportedPermissionTypes;

      const orchestrator = createPermissionOrchestrator(permissionType);

      const permissionConfirmationPage =
        orchestrator.buildPermissionConfirmationPage(activeContext);

      await snap.request({
        method: 'snap_updateInterface',
        params: {
          id,
          context: activeContext,
          ui: permissionConfirmationPage,
        },
      });
    }
  }
};
