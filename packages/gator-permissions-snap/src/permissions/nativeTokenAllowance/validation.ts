import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError } from '@metamask/snaps-sdk';

import { validateHexInteger, validateStartTime } from '../validation';
import type {
  NativeTokenAllowancePermission,
  NativeTokenAllowancePermissionRequest,
} from './types';
import { zNativeTokenAllowancePermission } from './types';

/**
 * Validates a permission object data specific to the native token allowance permission type.
 * @param permission - The permission object to validate.
 * @param rules - The rules of the permission request.
 * @returns True if the permission data is valid.
 * @throws {InvalidInputError} If any validation check fails.
 */
function validatePermissionData(
  permission: NativeTokenAllowancePermission,
  rules: NativeTokenAllowancePermissionRequest['rules'],
): true {
  const { allowanceAmount, startTime } = permission.data;

  validateHexInteger({
    name: 'allowanceAmount',
    value: allowanceAmount,
    required: true,
    allowZero: false,
  });

  validateStartTime(startTime, rules);

  return true;
}

/**
 * Parses and validates a permission request for native token allowance.
 * @param permissionRequest - The permission request object to validate.
 * @returns A validated permission request object.
 * @throws {InvalidInputError} If the permission request is invalid.
 */
export function parseAndValidatePermission(
  permissionRequest: PermissionRequest,
): NativeTokenAllowancePermissionRequest {
  const {
    data: validationResult,
    error: validationError,
    success,
  } = zNativeTokenAllowancePermission.safeParse(permissionRequest.permission);

  if (!success) {
    throw new InvalidInputError(extractZodError(validationError.errors));
  }

  validatePermissionData(validationResult, permissionRequest.rules);

  return {
    ...permissionRequest,
    permission: validationResult,
  };
}
