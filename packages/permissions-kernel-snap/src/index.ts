import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  MethodNotFoundError,
  type Json,
  type JsonRpcParams,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';

import { createPermissionOfferRegistryManager } from './registryManager';
import { createRpcHandler } from './rpc/rpcHandler';
import { RpcMethod } from './rpc/rpcMethod';

// set up dependencies
const rpcHandler = createRpcHandler({
  permissionOfferRegistryManager: createPermissionOfferRegistryManager(snap),
  snapsProvider: snap,
});

// configure RPC methods bindings
const boundRpcHandlers: {
  [RpcMethod: string]: (options: {
    siteOrigin: string;
    params?: JsonRpcParams;
  }) => Promise<Json>;
} = {
  [RpcMethod.WalletRequestExecutionPermissions]:
    rpcHandler.requestExecutionPermissions.bind(rpcHandler),
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  logger.info(
    `Custom request (origin="${origin}"):`,
    JSON.stringify(request, null, 2),
  );

  // Use Object.prototype.hasOwnProperty.call() to prevent prototype pollution attacks
  // This ensures we only access methods that exist on boundRpcHandlers itself
  if (!Object.prototype.hasOwnProperty.call(boundRpcHandlers, request.method)) {
    throw new MethodNotFoundError(`Method ${request.method} not found.`);
  }

  // We know that the method exists, so we can cast to NonNullable
  const handler = boundRpcHandlers[request.method] as NonNullable<
    (typeof boundRpcHandlers)[string]
  >;

  const result = await handler({
    siteOrigin: origin,
    params: request.params as JsonRpcParams,
  });

  return result;
};
