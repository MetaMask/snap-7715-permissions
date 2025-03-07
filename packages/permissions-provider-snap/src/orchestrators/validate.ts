/* eslint-disable @typescript-eslint/no-throw-literal */
import type { Permission } from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError } from '@metamask/snaps-sdk';

import type {
  SupportedPermissionTypes,
  PermissionTypeMapping,
} from './orchestrator';
import { zodObjectMapper } from './orchestrator';

/**
 * Parses a permission request and returns the permission object.
 *
 * @param basePermission - The base permission object.
 * @param permissionType - The permission type.
 * @returns The permission object.
 * @throws An error if the permission in the request is invalid.
 * @throws An error if the permission type is not supported.
 */
export const parsePermission = <
  TPermissionType extends SupportedPermissionTypes,
>(
  basePermission: Permission,
  permissionType: TPermissionType,
): PermissionTypeMapping[TPermissionType] => {
  const zValidatorKey = permissionType as keyof typeof zodObjectMapper;
  const zValidator = zodObjectMapper[zValidatorKey];
  if (!zValidator) {
    throw new Error(
      `Validation for Permission type ${permissionType} is not supported`,
    );
  }

  const validateRes = zValidator.safeParse(basePermission);
  if (!validateRes.success) {
    throw new InvalidParamsError(extractZodError(validateRes.error.errors));
  }

  return validateRes.data as PermissionTypeMapping[typeof permissionType];
};
