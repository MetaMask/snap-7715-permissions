import type { GrantAttenuatedPermissionsParams } from '../../../shared/src/types';
import {
  extractZodError,
  zGrantAttenuatedPermissionsParams,
} from '../../../shared/src/types';
import { InternalMethod } from '../permissions/origin';

export const validatePermissionRequestParam = (
  params: any | any[],
): GrantAttenuatedPermissionsParams => {
  const validateGrantAttenuatedPermissionsParams =
    zGrantAttenuatedPermissionsParams.safeParse(params);
  if (!validateGrantAttenuatedPermissionsParams.success) {
    throw new Error(
      extractZodError(
        InternalMethod.PermissionProviderGrantAttenuatedPermissions,
        validateGrantAttenuatedPermissionsParams.error.errors,
      ),
    );
  }

  if (
    validateGrantAttenuatedPermissionsParams.data.permissionsRequest.length ===
    0
  ) {
    throw Error('params are empty');
  }

  return validateGrantAttenuatedPermissionsParams.data;
};
