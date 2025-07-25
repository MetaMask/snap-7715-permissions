/* eslint-disable @typescript-eslint/no-throw-literal */
import {
  type PermissionsRequest,
  type PermissionsResponse,
  zPermissionsRequest,
  zPermissionsResponse,
} from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';

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
