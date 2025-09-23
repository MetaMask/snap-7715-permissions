import {
  type RequestExecutionPermissionsParam,
  zRequestExecutionPermissionsParam,
} from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/delegation-core';
import { InvalidInputError, type Json } from '@metamask/snaps-sdk';
import { z } from 'zod';

import { getStartOfTodayLocal } from './time';

export const validatePermissionRequestParam = (
  params: unknown,
): RequestExecutionPermissionsParam => {
  const validateGrantAttenuatedPermissionsParams =
    zRequestExecutionPermissionsParam.safeParse(params);
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

// Validation schema for revocation parameters
const zRevocationParams = z.object({
  delegationHash: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{64}$/u,
      'Invalid delegation hash format - must be a 32-byte hex string',
    ),
});

/**
 * Validates the revocation parameters.
 * @param params - The parameters to validate.
 * @returns The validated parameters.
 * @throws InvalidInputError if validation fails.
 */
export function validateRevocationParams(params: Json): {
  delegationHash: Hex;
} {
  try {
    if (!params || typeof params !== 'object') {
      throw new InvalidInputError('Parameters are required');
    }

    const validated = zRevocationParams.parse(params);
    return {
      delegationHash: validated.delegationHash as Hex,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new InvalidInputError(extractZodError(error.errors));
    }
    throw error;
  }
}
