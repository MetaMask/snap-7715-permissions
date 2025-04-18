import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  OnHomePageHandler,
  OnInstallHandler,
  Json,
  JsonRpcParams,
  OnRpcRequestHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import { lineaSepolia, sepolia } from 'viem/chains';

import { createPermissionConfirmationRenderHandler } from './confirmation';
import {
  isMethodAllowedForOrigin,
  createRpcHandler,
  RpcMethod,
  UserEventDispatcher,
  AccountController,
  TokenPricesService,
  PriceApiClient,
} from './core';
import { HomePage } from './homepage';

// set up dependencies
const accountController = new AccountController({
  snapsProvider: snap,
  supportedChains: [sepolia, lineaSepolia],
  deploymentSalt: '0x',
});

const homepage = new HomePage({
  accountController,
  snapsProvider: snap,
});

const userEventDispatcher = new UserEventDispatcher();

const permissionConfirmationRenderHandler =
  createPermissionConfirmationRenderHandler({
    snapsProvider: snap,
    userEventDispatcher,
  });

// eslint-disable-next-line no-restricted-globals
const priceApiClient = new PriceApiClient(process.env.PRICE_API_BASE_URL ?? '');
const tokenPricesService = new TokenPricesService(priceApiClient, snap);

const rpcHandler = createRpcHandler({
  accountController,
  permissionConfirmationRenderHandler,
  tokenPricesService,
  userEventDispatcher,
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
 * @returns Resolves once any registered event handlers have completed.
 */
export const onUserInput: OnUserInputHandler = async (args) =>
  userEventDispatcher.handleUserInputEvent(args);

export const onHomePage: OnHomePageHandler = async () => {
  return {
    content: await homepage.buildHomepage(),
  };
};

export const onInstall: OnInstallHandler = async () => {
  await homepage.showWelcomeScreen();
};
