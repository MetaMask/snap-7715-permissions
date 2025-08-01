import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';

import { validateHexInteger } from '../validation';
import type {
  Erc20TokenStreamPermission,
  Erc20TokenStreamPermissionRequest,
} from './types';
import { zErc20TokenStreamPermission } from './types';

/**
 * Validates a permission object data specific to the permission type.
 * @param permission - The ERC20 token stream permission object to validate.
 * @returns True if the permission data is valid, throws an error otherwise.
 * @throws {Error} If any validation check fails.
 */
function validatePermissionData(
  permission: Erc20TokenStreamPermission,
  expiry: number,
): true {
  const { initialAmount, maxAmount, amountPerSecond, startTime } = permission.data;

  validateHexInteger({
    name: 'maxAmount',
    value: maxAmount,
    required: false,
    allowZero: false,
  });

  validateHexInteger({
    name: 'initialAmount',
    value: initialAmount,
    required: false,
    allowZero: true,
  });

  validateHexInteger({
    name: 'amountPerSecond',
    value: amountPerSecond,
    required: true,
    allowZero: false,
  });

  if (initialAmount && maxAmount && BigInt(maxAmount) < BigInt(initialAmount)) {
    throw new Error('Invalid maxAmount: must be greater than initialAmount');
  }

  const timeToValidate = startTime ? startTime : Math.floor(Date.now() / 1000);

  if (timeToValidate >= expiry) {
    throw new Error('Invalid startTime: must be before expiry');
  }

  return true;
}

/**
 * Parses and validates a permission request for ERC20 token streaming.
 * @param permissionRequest - The permission request object to validate.
 * @returns A validated permission request object.
 * @throws {Error} If the permission request is invalid.
 */
export function parseAndValidatePermission(
  permissionRequest: PermissionRequest,
): Erc20TokenStreamPermissionRequest {
  const {
    data: validationResult,
    error: validationError,
    success,
  } = zErc20TokenStreamPermission.safeParse(permissionRequest.permission);

  if (!success) {
    throw new Error(extractZodError(validationError.errors));
  }

  validatePermissionData(validationResult, permissionRequest.expiry);

  return {
    ...permissionRequest,
    isAdjustmentAllowed: permissionRequest.isAdjustmentAllowed ?? true,
    permission: {
      ...validationResult,
      data: {
        ...validationResult.data,
        initialAmount: validationResult.data.initialAmount,
        maxAmount: validationResult.data.maxAmount,
      },
    },
  };
}
