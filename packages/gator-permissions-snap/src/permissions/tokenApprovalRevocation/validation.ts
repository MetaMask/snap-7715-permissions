import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError } from '@metamask/snaps-sdk';

import { validateRedeemerRule } from '../validation';
import type { TokenApprovalRevocationPermissionRequest } from './types';
import { zTokenApprovalRevocationPermission } from './types';

/**
 * Parses and validates a permission request for token approval revocation.
 * @param permissionRequest - The permission request object to validate.
 * @returns A validated permission request object.
 * @throws {Error} If the permission request is invalid.
 */
export function parseAndValidate(
  permissionRequest: PermissionRequest,
): TokenApprovalRevocationPermissionRequest {
  const {
    data: validationResult,
    error: validationError,
    success,
  } = zTokenApprovalRevocationPermission.safeParse(
    permissionRequest.permission,
  );

  if (!success) {
    throw new InvalidInputError(extractZodError(validationError.errors));
  }

  validateRedeemerRule(permissionRequest.rules);

  return {
    ...permissionRequest,
    permission: validationResult,
  };
}
