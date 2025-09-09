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
 * Checks if an object contains prototype pollution keys.
 * Recursively validates nested objects and arrays to prevent prototype pollution
 * at any depth in the object structure.
 *
 * @param obj - The object to check.
 * @returns True if the object is safe (no prototype pollution keys).
 */
function isSafeObject(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return true;
  }

  // Check for exact dangerous keys (not substrings)
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

  // Check if any dangerous keys exist as own properties
  const hasDangerousKey = dangerousKeys.some((dangerousKey) =>
    Object.prototype.hasOwnProperty.call(obj, dangerousKey),
  );

  if (hasDangerousKey) {
    return false;
  }

  // Recursively check nested objects and arrays
  for (const value of Object.values(obj)) {
    if (!isSafeObject(value)) {
      return false;
    }
  }

  return true;
}

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
      z.array(z.unknown()).refine((arr) => arr.every(isSafeObject), {
        message: 'Invalid key in array: potential prototype pollution attempt',
      }),
      z.record(z.unknown()).refine((obj) => isSafeObject(obj), {
        message: 'Invalid key: potential prototype pollution attempt',
      }),
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
  // Validate the JSON-RPC structure using Zod
  const validationResult = zJsonRpcRequest.safeParse(request);

  if (!validationResult.success) {
    const errorMessage = extractZodError(validationResult.error.errors);

    logger.warn('Invalid JSON-RPC request structure:', {
      errors: errorMessage,
      request: JSON.stringify(request, null, 2),
    });

    throw new InvalidParamsError(`Invalid JSON-RPC request: ${errorMessage}`);
  }

  return validationResult.data;
}
