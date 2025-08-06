import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';

import { validateHexInteger } from '../validation';
import type {
  Erc20TokenPeriodicPermission,
  Erc20TokenPeriodicPermissionRequest,
} from './types';
import { zErc20TokenPeriodicPermission } from './types';

/**
 * Validates a permission object data specific to the permission type.
 * @param permission - The ERC20 token periodic permission object to validate.
 * @param expiry - The expiry time of permission request.
 * @returns True if the permission data is valid, throws an error otherwise.
 * @throws {Error} If any validation check fails.
 */
function validatePermissionData(
  permission: Erc20TokenPeriodicPermission,
  expiry: number,
): true {
  const { periodAmount, startTime } = permission.data;

  validateHexInteger({
    name: 'periodAmount',
    value: periodAmount,
    required: true,
    allowZero: false,
  });

  // If startTime is not provided it default to Date.now(), expiry is always in the future so no need to check.
  if (startTime && startTime >= expiry) {
    throw new Error('Invalid startTime: must be before expiry');
  }

  return true;
}

/**
 * Parses and validates a permission request for ERC20 token periodic transfers.
 * @param permissionRequest - The permission request object to validate.
 * @returns A validated permission request object.
 * @throws {Error} If the permission request is invalid.
 */
export function parseAndValidatePermission(
  permissionRequest: PermissionRequest,
): Erc20TokenPeriodicPermissionRequest {
  const {
    data: validationResult,
    error: validationError,
    success,
  } = zErc20TokenPeriodicPermission.safeParse(permissionRequest.permission);

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
