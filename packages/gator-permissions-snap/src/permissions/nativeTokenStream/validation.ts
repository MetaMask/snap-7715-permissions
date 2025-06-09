import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { validateHexInteger } from '../validation';

import type {
  NativeTokenStreamPermission,
  NativeTokenStreamPermissionRequest,
} from './types';
import { zNativeTokenStreamPermission } from './types';

/**
 * Validates a permission object data specific to the permission type.
 * @param permission - The native token stream permission object to validate.
 * @returns True if the permission data is valid, throws an error otherwise.
 * @throws {Error} If any validation check fails.
 */
function validatePermissionData(permission: NativeTokenStreamPermission): true {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

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
    allowZero: false,
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

  if (startTime <= 0) {
    throw new Error('Invalid startTime: must be a positive number');
  }

  if (startTime !== Math.floor(startTime)) {
    throw new Error('Invalid startTime: must be an integer');
  }

  return true;
}

/**
 * Parses and validates a permission request for native token streaming.
 * @param permissionRequest - The permission request object to validate.
 * @returns A validated permission request object.
 * @throws {Error} If the permission request is invalid.
 */
export function parseAndValidatePermission(
  permissionRequest: PermissionRequest,
): NativeTokenStreamPermissionRequest {
  const {
    data: validationResult,
    error: validationError,
    success,
  } = zNativeTokenStreamPermission.safeParse(permissionRequest.permission);

  if (!success) {
    throw new Error(extractZodError(validationError.errors));
  }

  validatePermissionData(validationResult);

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
