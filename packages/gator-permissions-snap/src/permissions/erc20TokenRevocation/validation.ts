import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError } from '@metamask/snaps-sdk';

import type { Erc20TokenRevocationPermissionRequest } from './types';
import { zErc20TokenRevocationPermission } from './types';

/**
 * Parses and validates a permission request for ERC20 token approval revocation.
 * @param permissionRequest - The permission request object to validate.
 * @returns A validated permission request object.
 * @throws {Error} If the permission request is invalid.
 */
export function parseAndValidatePermission(
  permissionRequest: PermissionRequest,
): Erc20TokenRevocationPermissionRequest {
  const {
    data: validationResult,
    error: validationError,
    success,
  } = zErc20TokenRevocationPermission.safeParse(permissionRequest.permission);

  if (!success) {
    throw new InvalidInputError(extractZodError(validationError.errors));
  }

  return {
    ...permissionRequest,
    permission: validationResult,
  };
}
