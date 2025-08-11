import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';

import { validateHexInteger } from '../validation';
import type {
  NativeTokenStreamPermission,
  NativeTokenStreamPermissionRequest,
} from './types';
import { zNativeTokenStreamPermission } from './types';
import { InvalidInputError } from '@metamask/snaps-sdk';

/**
 * Validates a permission object data specific to the permission type.
 * @param permission - The native token stream permission object to validate.
 * @param rules - The rules of the permission request.
 * @returns True if the permission data is valid, throws an error otherwise.
 * @throws {Error} If any validation check fails.
 */
function validatePermissionData(
  permission: NativeTokenStreamPermission,
  rules: NativeTokenStreamPermissionRequest['rules'],
): true {
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
    throw new InvalidInputError('Invalid maxAmount: must be greater than initialAmount');
  }

  const expiryRule = rules?.find((rule) => rule.type === 'expiry');
  if (!expiryRule) {
    throw new Error('Expiry rule is required');
  }
  const expiry = Number(expiryRule.data.timestamp);

  // If startTime is not provided it default to Date.now(), expiry is always in the future so no need to check.
  if (startTime && startTime >= expiry) {
    throw new InvalidInputError('Invalid startTime: must be before expiry');
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
    throw new InvalidInputError(extractZodError(validationError.errors));
  }

  validatePermissionData(validationResult, permissionRequest.rules);

  return {
    ...permissionRequest,
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
