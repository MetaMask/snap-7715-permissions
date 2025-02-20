import { isMethodAllowedForOrigin } from './rpc/permissions';
import { Json, JsonRpcParams, OnRpcRequestHandler } from '@metamask/snaps-sdk';
import { RpcHandler } from './rpc/rpcHandler';
import { RpcMethod } from './rpc/rpcMethod';
import { Logger } from '@metamask/7715-permissions-shared';
import {
  BaseOrchestratorParams,
  Orchestrator,
  OrchestratorRegistry,
} from './rpc/orchestratorRegistry';

// set up dependencies
const _logger = new Logger();
const accountController = {};
const rpcHandler = new RpcHandler({
  snapsProvider: snap,
  accountController,
  logger: _logger,
});

const orchestratorRegistry = new OrchestratorRegistry();

// configure RPC methods bindings
const boundRpcHandlers: {
  [method: string]: (params?: JsonRpcParams) => Promise<Json>;
} = {
  [RpcMethod.Ping]: rpcHandler.ping.bind(rpcHandler),
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
  _logger.info(
    `Custom request (origin="${origin}"):`,
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
