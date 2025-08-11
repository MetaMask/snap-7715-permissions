import {
  type GrantAttenuatedPermissionsParams,
  zGrantAttenuatedPermissionsParams,
} from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidInputError } from '@metamask/snaps-sdk';

import { getStartOfTodayLocal } from './time';

export const validatePermissionRequestParam = (
  params: any | any[],
): GrantAttenuatedPermissionsParams => {
  const validateGrantAttenuatedPermissionsParams =
    zGrantAttenuatedPermissionsParams.safeParse(params);
  if (!validateGrantAttenuatedPermissionsParams.success) {
    throw new InvalidInputError(
      extractZodError(validateGrantAttenuatedPermissionsParams.error.errors),
    );
  }

  return validateGrantAttenuatedPermissionsParams.data;
};

/**
 * Zod validation for startTime to ensure it's today or later.
 * @param value - Unix timestamp in seconds.
 * @returns True if the start time is today or later, false otherwise.
 */
export const validateStartTimeZod = (value: number): boolean => {
  const startOfToday = getStartOfTodayLocal();
  return value >= startOfToday;
};
