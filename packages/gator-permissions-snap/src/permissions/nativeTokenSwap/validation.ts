import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError } from '@metamask/snaps-sdk';

import { validateHexInteger } from '../validation';
import type {
  NativeTokenSwapPermission,
  NativeTokenSwapPermissionRequest,
} from './types';
import { zNativeTokenSwapPermission } from './types';

/**
 * Validates permission-specific data for native token swap.
 * @param permission - The parsed native token swap permission.
 */
function validatePermissionData(permission: NativeTokenSwapPermission): true {
  validateHexInteger({
    name: 'maxNativeSwapAmount',
    value: permission.data.maxNativeSwapAmount,
    required: true,
    allowZero: false,
  });

  return true;
}

/**
 * Parses and validates a native token swap permission request.
 * @param permissionRequest - The permission request to validate.
 * @returns The validated typed request.
 */
export function parseAndValidatePermission(
  permissionRequest: PermissionRequest,
): NativeTokenSwapPermissionRequest {
  const {
    data: validationResult,
    error: validationError,
    success,
  } = zNativeTokenSwapPermission.safeParse(permissionRequest.permission);

  if (!success) {
    throw new InvalidInputError(extractZodError(validationError.errors));
  }

  validatePermissionData(validationResult);

  return {
    ...permissionRequest,
    permission: validationResult,
  };
}
