/* eslint-disable @typescript-eslint/no-throw-literal */
import {
  type PermissionOffer,
  type PermissionsRequest,
  zPermissionOffer,
  zPermissionsRequest,
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
  params: any,
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
 * Safely parses the permissions offer request parameters, validating them using Zod schema.
 *
 * @param params - The permission offer to parse.
 * @returns The parsed and validated permissions offer as a PermissionOffer object.
 * @throws Throws a SnapError if validation fails.
 */
export const parsePermissionOfferParam = (params: any): PermissionOffer => {
  const validatePermissionOffer = zPermissionOffer.safeParse(params);
  if (!validatePermissionOffer.success) {
    throw new InvalidParamsError(
      extractZodError(validatePermissionOffer.error.errors),
    );
  }

  return validatePermissionOffer.data;
};
