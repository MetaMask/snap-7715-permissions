import {
  type GrantAttenuatedPermissionsParams,
  zGrantAttenuatedPermissionsParams,
} from '../../../shared/src/types';
import { extractZodError } from '../../../shared/src/utils';
import { throwError } from './common';

export const validatePermissionRequestParam = (
  params: any | any[],
): GrantAttenuatedPermissionsParams => {
  const validateGrantAttenuatedPermissionsParams =
    zGrantAttenuatedPermissionsParams.safeParse(params);
  if (!validateGrantAttenuatedPermissionsParams.success) {
    throw new Error(
      extractZodError(validateGrantAttenuatedPermissionsParams.error.errors),
    );
  }

  if (
    validateGrantAttenuatedPermissionsParams.data.permissionsRequest.length ===
    0
  ) {
    throwError('params are empty');
  }

  return validateGrantAttenuatedPermissionsParams.data;
};
