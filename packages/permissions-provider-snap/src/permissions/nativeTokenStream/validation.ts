import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';

import type {
  NativeTokenStreamPermission,
  NativeTokenStreamPermissionRequest,
} from './types';
import { zNativeTokenStreamPermission } from './types';

/**
 * Validates a permission object data specific to the permission type.
 * @param permission - The native token stream permission object to validate.
 * @returns True if the permission data is valid, throws an error otherwise.
 * @throws {InvalidParamsError} If any validation check fails.
 */
function validatePermissionData(permission: NativeTokenStreamPermission): true {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;
  const bigIntAmountPerSecond = BigInt(amountPerSecond);

  if (maxAmount) {
    if (BigInt(maxAmount) === 0n) {
      throw new InvalidParamsError(
        'Invalid maxAmount: must be a positive number',
      );
    }
  }

  if (initialAmount) {
    const bigIntInitialAmount = BigInt(initialAmount);
    if (bigIntInitialAmount === 0n) {
      throw new InvalidParamsError(
        'Invalid initialAmount: must be greater than zero',
      );
    }
    if (maxAmount) {
      if (BigInt(maxAmount) < bigIntInitialAmount) {
        throw new InvalidParamsError(
          'Invalid maxAmount: must be greater than initialAmount',
        );
      }
    }
  }

  if (bigIntAmountPerSecond === 0n) {
    throw new InvalidParamsError(
      'Invalid amountPerSecond: must be a positive number',
    );
  }

  if (startTime <= 0) {
    throw new InvalidParamsError(
      'Invalid startTime: must be a positive number',
    );
  }

  if (startTime !== Math.floor(startTime)) {
    throw new InvalidParamsError('Invalid startTime: must be an integer');
  }

  return true;
}

/**
 * Parses and validates a permission request for native token streaming.
 * @param permissionRequest - The permission request object to validate.
 * @returns A validated permission request object.
 * @throws {InvalidParamsError} If the permission request is invalid.
 */
export function parseAndValidatePermission(
  permissionRequest: NativeTokenStreamPermissionRequest,
): NativeTokenStreamPermissionRequest {
  const {
    data: validationResult,
    error: validationError,
    success,
  } = zNativeTokenStreamPermission.safeParse(permissionRequest.permission);

  if (!success) {
    throw new InvalidParamsError(extractZodError(validationError.errors));
  }

  validatePermissionData(validationResult);

  return {
    ...permissionRequest,
    isAdjustmentAllowed: permissionRequest.isAdjustmentAllowed,
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
