import {
  type GrantAttenuatedPermissionsParams,
  zGrantAttenuatedPermissionsParams,
} from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';

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

  return validateGrantAttenuatedPermissionsParams.data;
};
