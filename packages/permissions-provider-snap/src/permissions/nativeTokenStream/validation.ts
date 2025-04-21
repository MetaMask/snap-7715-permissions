/* eslint-disable @typescript-eslint/no-throw-literal */
import type { Permission } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';

import type { NativeTokenStreamPermission } from './types';
import { zNativeTokenStreamPermission } from './types';

/**
 * Parses a permission request and returns the permission object.
 *
 * @param basePermission - The base permission object.
 * @returns The permission object.
 * @throws An error if the permission in the request is invalid.
 * @throws An error if the permission type is not supported.
 */
export const parsePermission = (
  basePermission: Permission,
): NativeTokenStreamPermission => {
  const validateRes = zNativeTokenStreamPermission.safeParse(basePermission);
  if (!validateRes.success) {
    throw new InvalidParamsError(extractZodError(validateRes.error.errors));
  }

  return validateRes.data;
};

/**
 * Validates a permission object data specific to the permission type.
 *
 * @param permission - The permission object.
 * @returns True if the permission object data is valid.
 * @throws Error if the initial amount is not greater than 0.
 * @throws Error if the max amount is not greater than 0.
 * @throws Error if the max amount is less than the initial amount.
 * @throws Error if the amount per second is not a positive number.
 * @throws Error if the start time is not a positive number.
 */
export const validatePermissionData = (
  permission: NativeTokenStreamPermission,
): true => {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

  if (maxAmount !== undefined) {
    const bigIntMaxAmount = BigInt(maxAmount);

    if (bigIntMaxAmount === 0n) {
      throw new InvalidParamsError(
        'Invalid maxAmount: must be a positive number',
      );
    }
    if (initialAmount) {
      if (bigIntMaxAmount < BigInt(initialAmount)) {
        throw new InvalidParamsError(
          'Invalid maxAmount: must be greater than initialAmount',
        );
      }
    }
  }

  if (initialAmount) {
    const bigIntInitialAmount = BigInt(initialAmount);
    if (bigIntInitialAmount === 0n) {
      throw new InvalidParamsError(
        'Invalid initialAmount: must be greater than zero',
      );
    }
  }

  const bigIntAmountPerSecond = BigInt(amountPerSecond);

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
};
