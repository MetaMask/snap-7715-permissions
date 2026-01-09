import {
  zRequestExecutionPermissionsParam,
  zGetGrantedPermissionsParam,
  zHexStr,
} from '@metamask/7715-permissions-shared/types';
import type {
  RequestExecutionPermissionsParam,
  GetGrantedPermissionsParam,
} from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/delegation-core';
import { InvalidInputError } from '@metamask/snaps-sdk';
import type { Json } from '@metamask/snaps-sdk';
import { z } from 'zod';

export const validateGetGrantedPermissionsParams = (
  params: unknown,
): GetGrantedPermissionsParam => {
  const result = zGetGrantedPermissionsParam.safeParse(params);

  // Support undefined/null and invalid params (treat as no filters)
  if (!result.success || params === undefined || params === null) {
    return {};
  }

  return result.data;
};

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

// Validation schema for revocation parameters
const zRevocationParams = z.object({
  permissionContext: zHexStr,
});

/**
 * Validates the revocation parameters.
 * @param params - The parameters to validate.
 * @returns The validated parameters.
 * @throws InvalidInputError if validation fails.
 */
export function validateRevocationParams(params: Json): {
  permissionContext: Hex;
} {
  try {
    if (!params || typeof params !== 'object') {
      throw new InvalidInputError('Parameters are required');
    }

    const validated = zRevocationParams.parse(params);

    return {
      permissionContext: validated.permissionContext,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new InvalidInputError(extractZodError(error.errors));
    }
    throw error;
  }
}
