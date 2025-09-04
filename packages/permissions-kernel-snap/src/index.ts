import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  InvalidParamsError,
  LimitExceededError,
  MethodNotFoundError,
  type Json,
  type JsonRpcParams,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';

import { createPermissionOfferRegistryManager } from './registryManager';
import { createRpcHandler } from './rpc/rpcHandler';
import { RpcMethod } from './rpc/rpcMethod';
import { validateJsonRpcRequest } from './utils';

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

// Processing lock to ensure only one RPC request is processed at a time
// Use a token-based lock to avoid race conditions across async boundaries
let activeProcessingLock: symbol | null = null;

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A JSON-RPC request object that will be validated.
 * @returns The result of the RPC method execution (The 7715 permissions response from the permissions provider).
 * @throws If the request is invalid, method is not found, or processing fails.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  // Check if another request is already being processed
  if (activeProcessingLock !== null) {
    logger.warn(
      `RPC request rejected (origin="${origin}"): another request is already being processed`,
    );
    throw new LimitExceededError('Another request is already being processed.');
  }

  // Acquire the processing lock
  const myLock = Symbol('processing-lock');
  activeProcessingLock = myLock;

  try {
    logger.info(
      `Custom request (origin="${origin}"):`,
      JSON.stringify(request, undefined, 2),
    );

    // First check if the request is a valid object
    if (typeof request !== 'object' || request === null) {
      throw new InvalidParamsError('Request must be a valid JSON-RPC object');
    }

    // Check if method exists first (for proper error codes)
    if (!request.method || typeof request.method !== 'string') {
      throw new InvalidParamsError('Request must have a valid method');
    }

    // Use Object.prototype.hasOwnProperty.call() to prevent prototype pollution attacks
    if (
      !Object.prototype.hasOwnProperty.call(boundRpcHandlers, request.method)
    ) {
      logger.warn('Method not found in bound handlers:', request.method);
      throw new MethodNotFoundError(`Method ${request.method} not found.`);
    }

    // Now validate the full JSON-RPC structure
    const validatedRequest = validateJsonRpcRequest(request);

    // We know that the method exists, so we can cast to NonNullable
    const handler = boundRpcHandlers[validatedRequest.method] as NonNullable<
      (typeof boundRpcHandlers)[string]
    >;

    const result = await handler({
      siteOrigin: origin,
      params: validatedRequest.params as JsonRpcParams,
    });

    return result;
  } finally {
    // Always release the processing lock we acquired, regardless of success or failure
    // Only release if we still hold the lock to avoid clobbering a newer lock
    if (activeProcessingLock === myLock) {
      activeProcessingLock = null;
    }
  }
};
