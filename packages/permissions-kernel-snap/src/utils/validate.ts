/* eslint-disable @typescript-eslint/no-throw-literal */
import {
  type PermissionsRequest,
  type PermissionsResponse,
  zPermissionsRequest,
  zPermissionsResponse,
} from '@metamask/7715-permissions-shared/types';
import {
  extractZodError,
  logger,
} from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';
import { z } from 'zod';
import { RpcMethod } from '../rpc/rpcMethod';

/**
 * Safely parses the grant permissions request parameters, validating them using Zod schema.
 *
 * @param params - The permissions to parse.
 * @returns The parsed and validated permissions as a PermissionsRequest object.
 * @throws Throws a InvalidParamsError if validation fails or if the permissions data is empty.
 */
export const parsePermissionRequestParam = (
  params: unknown,
): PermissionsRequest => {
  const validatePermissionsRequest = zPermissionsRequest.safeParse(params);
  if (!validatePermissionsRequest.success) {
    throw new InvalidParamsError(
      extractZodError(validatePermissionsRequest.error.errors),
    );
  }

  if (validatePermissionsRequest.data.length === 0) {
    throw new InvalidParamsError('params are empty');
  }

  return validatePermissionsRequest.data;
};

/**
 * Safely parses the grant permissions response parameters, validating them using Zod schema.
 *
 * @param params - The permissions to parse.
 * @returns The parsed and validated permissions as a PermissionsResponse object.
 * @throws Throws a InvalidParamsError if validation fails or if the permissions data is empty.
 */
export const parsePermissionsResponseParam = (
  params: unknown,
): PermissionsResponse => {
  const validatePermissionsResponse = zPermissionsResponse.safeParse(params);
  if (!validatePermissionsResponse.success) {
    throw new InvalidParamsError(
      extractZodError(validatePermissionsResponse.error.errors),
    );
  }

  if (validatePermissionsResponse.data.length === 0) {
    throw new InvalidParamsError('params are empty');
  }

  return validatePermissionsResponse.data;
};

/**
 * Zod schema for validating JSON-RPC request structure
 */
export const zJsonRpcRequest = z.object({
  /**
   * The JSON-RPC version, must be "2.0"
   */
  jsonrpc: z.literal('2.0'),

  /**
   * The method name - must be a valid RPC method
   */
  method: z.nativeEnum(RpcMethod),

  /**
   * The parameters for the method - must be valid JsonRpcParams
   */
  params: z
    .union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(z.unknown()),
      z.record(z.unknown()),
    ])
    .optional(),

  /**
   * The request ID - must be a string or number
   */
  id: z.union([z.string(), z.number()]).optional(),
});

/**
 * Type for a validated JSON-RPC request
 */
export type ValidatedJsonRpcRequest = z.infer<typeof zJsonRpcRequest>;

/**
 * Validates that the request object is a proper JSON-RPC request
 * and that the method is supported by this snap.
 *
 * @param request - The request object to validate.
 * @returns The validated request object.
 * @throws InvalidParamsError if validation fails.
 */
export function validateJsonRpcRequest(
  request: unknown,
): ValidatedJsonRpcRequest {
  // First, ensure the request is an object
  if (typeof request !== 'object' || request === null) {
    throw new InvalidParamsError('Request must be a valid JSON-RPC object');
  }

  // Validate the JSON-RPC structure using Zod
  const validationResult = zJsonRpcRequest.safeParse(request);

  if (!validationResult.success) {
    const errorMessages = validationResult.error.errors.map((error) => {
      const path = error.path.length > 0 ? error.path.join('.') : 'root';
      return `${path}: ${error.message}`;
    });

    logger.warn('Invalid JSON-RPC request structure:', {
      errors: errorMessages,
      request: JSON.stringify(request, null, 2),
    });

    throw new InvalidParamsError(
      `Invalid JSON-RPC request: ${errorMessages.join(', ')}`,
    );
  }

  return validationResult.data;
}

/**
 * Validates that the request method exists in the bound handlers.
 * This provides an additional layer of security beyond the Zod schema.
 *
 * @param method - The method name to validate.
 * @param boundHandlers - The object containing bound RPC handlers.
 * @throws InvalidParamsError if method is not found.
 */
export function validateMethodExists(
  method: string,
  boundHandlers: Record<string, unknown>,
): void {
  // Use Object.prototype.hasOwnProperty.call() to prevent prototype pollution attacks
  if (!Object.prototype.hasOwnProperty.call(boundHandlers, method)) {
    logger.warn('Method not found in bound handlers:', { method });
    throw new InvalidParamsError(`Method ${method} not found`);
  }
}
