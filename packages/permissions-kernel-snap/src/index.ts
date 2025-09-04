import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  LimitExceededError,
  type Json,
  type JsonRpcParams,
  type OnRpcRequestHandler,
} from '@metamask/snaps-sdk';

import { createPermissionOfferRegistryManager } from './registryManager';
import { createRpcHandler } from './rpc/rpcHandler';
import { RpcMethod } from './rpc/rpcMethod';
import { validateJsonRpcRequest, validateMethodExists } from './utils';

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
 * @returns The result of the RPC method execution.
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

    // Early validation of the JSON-RPC request structure and security
    const validatedRequest = validateJsonRpcRequest(request);

    // Additional validation that the method exists in our bound handlers
    validateMethodExists(validatedRequest.method, boundRpcHandlers);

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
