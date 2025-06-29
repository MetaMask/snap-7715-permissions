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
 * @returns True if the permission data is valid, throws an error otherwise.
 * @throws {Error} If any validation check fails.
 */
function validatePermissionData(
  permission: Erc20TokenPeriodicPermission,
): true {
  const { periodAmount, periodDuration, startTime, tokenAddress } =
    permission.data;

  validateHexInteger({
    name: 'periodAmount',
    value: periodAmount,
    required: true,
    allowZero: false,
  });

  if (periodDuration <= 0) {
    throw new Error('Invalid periodDuration: must be a positive number');
  }

  if (periodDuration !== Math.floor(periodDuration)) {
    throw new Error('Invalid periodDuration: must be an integer');
  }

  if (startTime <= 0) {
    throw new Error('Invalid startTime: must be a positive number');
  }

  if (startTime !== Math.floor(startTime)) {
    throw new Error('Invalid startTime: must be an integer');
  }

  if (!tokenAddress || tokenAddress === '0x') {
    throw new Error(
      'Invalid tokenAddress: must be a valid ERC20 token address',
    );
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

  validatePermissionData(validationResult);

  return {
    ...permissionRequest,
    isAdjustmentAllowed: permissionRequest.isAdjustmentAllowed ?? true,
    permission: validationResult,
  };
}
