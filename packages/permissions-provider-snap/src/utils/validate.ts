import type { GrantAttenuatedPermissionsParams } from '../../../shared/src';
import {
  extractZodError,
  zGrantAttenuatedPermissionsParams,
} from '../../../shared/src';
import { RpcMethod } from '../permissions/origin';
import { throwError } from './common';

export const validatePermissionRequestParam = (
  params: any | any[],
): GrantAttenuatedPermissionsParams => {
  const validateGrantAttenuatedPermissionsParams =
    zGrantAttenuatedPermissionsParams.safeParse(params);
  if (!validateGrantAttenuatedPermissionsParams.success) {
    throw new Error(
      extractZodError(
        RpcMethod.PermissionProviderGrantAttenuatedPermissions,
        validateGrantAttenuatedPermissionsParams.error.errors,
      ),
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
