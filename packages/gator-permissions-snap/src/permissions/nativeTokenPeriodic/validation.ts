import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';

import { validateHexInteger } from '../validation';
import type {
  NativeTokenPeriodicPermission,
  NativeTokenPeriodicPermissionRequest,
} from './types';
import { zNativeTokenPeriodicPermission } from './types';

/**
 * Validates a permission object data specific to the permission type.
 * @param permission - The native token periodic permission object to validate.
 * @returns True if the permission data is valid, throws an error otherwise.
 * @throws {Error} If any validation check fails.
 */
function validatePermissionData(
  permission: NativeTokenPeriodicPermission,
  expiry: number,
): true {
  const { periodAmount, startTime } = permission.data;

  validateHexInteger({
    name: 'periodAmount',
    value: periodAmount,
    required: true,
    allowZero: false,
  });

  const timeToValidate = startTime ? startTime : Math.floor(Date.now() / 1000);

  if (timeToValidate >= expiry) {
    throw new Error('Invalid startTime: must be before expiry');
  }

  return true;
}

/**
 * Parses and validates a permission request for native token periodic transfers.
 * @param permissionRequest - The permission request object to validate.
 * @returns A validated permission request object.
 * @throws {Error} If the permission request is invalid.
 */
export function parseAndValidatePermission(
  permissionRequest: PermissionRequest,
): NativeTokenPeriodicPermissionRequest {
  const {
    data: validationResult,
    error: validationError,
    success,
  } = zNativeTokenPeriodicPermission.safeParse(permissionRequest.permission);

  if (!success) {
    throw new Error(extractZodError(validationError.errors));
  }

  validatePermissionData(validationResult, permissionRequest.expiry);

  return {
    ...permissionRequest,
    isAdjustmentAllowed: permissionRequest.isAdjustmentAllowed ?? true,
    permission: validationResult,
  };
}
