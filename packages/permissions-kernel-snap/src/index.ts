import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Json, JsonRpcParams } from '@metamask/snaps-sdk';
import { type OnRpcRequestHandler } from '@metamask/snaps-sdk';

import { createPermissionOfferRegistryManger } from './registryManger';
import { createRpcHandler } from './rpc/rpcHandler';
import { RpcMethod } from './rpc/rpcMethod';

// set up dependencies
const rpcHandler = createRpcHandler({
  permissionOfferRegistryManger: createPermissionOfferRegistryManger(snap),
  snapsProvider: snap,
});

// configure RPC methods bindings
const boundRpcHandlers: {
  [RpcMethod: string]: (options: {
    siteOrigin: string;
    params?: JsonRpcParams;
  }) => Promise<Json>;
} = {
  [RpcMethod.WalletGrantPermissions]:
    rpcHandler.grantPermissions.bind(rpcHandler),
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
    JSON.stringify(request, undefined, 2),
  );

  const handler = boundRpcHandlers[request.method];

  if (!handler) {
    throw new Error(`Method ${request.method} not found.`);
  }

  const result = await handler({
    siteOrigin: origin,
    params: request.params as JsonRpcParams,
  });

  return result;
};
