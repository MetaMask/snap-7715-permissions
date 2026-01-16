/**
 * RPC Error Handler Wrapper
 *
 * This module demonstrates how to integrate the error tracking service
 * with RPC request handlers to capture and monitor errors in snap operations.
 */

import { getErrorTracker } from '@metamask/7715-permissions-shared/utils';
import type { Json, JsonRpcParams } from '@metamask/snaps-sdk';

type RpcHandler = (params?: JsonRpcParams) => Promise<Json>;

/**
 * Wraps an RPC handler with error tracking.
 * Captures any errors that occur during RPC execution while maintaining
 * the original error flow.
 *
 * @param handler - The original RPC handler function.
 * @param methodName - The RPC method name (for error tracking).
 * @returns A wrapped RPC handler with error tracking.
 */
export function wrapRpcHandlerWithErrorTracking(
  handler: RpcHandler,
  methodName: string,
): RpcHandler {
  return async (params?: JsonRpcParams): Promise<Json> => {
    const errorTracker = getErrorTracker();

    try {
      const result = await handler(params);

      // Check if response indicates an error (even with 200 status)
      if (
        result &&
        typeof result === 'object' &&
        'error' in result &&
        (result as any).error
      ) {
        await errorTracker.captureResponseError(result, methodName);
      }

      return result;
    } catch (error) {
      await errorTracker.captureError(error, methodName);
      throw error;
    }
  };
}

/**
 * Higher-order function to create multiple wrapped RPC handlers at once.
 * Useful for wrapping all RPC handlers in a batch operation.
 *
 * @param handlers - An object mapping method names to RPC handler functions.
 * @returns An object with wrapped handlers.
 */
export function wrapRpcHandlersWithErrorTracking(
  handlers: Record<string, RpcHandler>,
): Record<string, RpcHandler> {
  const wrapped: Record<string, RpcHandler> = {};

  for (const [methodName, handler] of Object.entries(handlers)) {
    wrapped[methodName] = wrapRpcHandlerWithErrorTracking(handler, methodName);
  }

  return wrapped;
}
