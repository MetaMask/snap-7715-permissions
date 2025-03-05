/* eslint-disable @typescript-eslint/no-throw-literal */
import {
  zNativeTokenStreamPermission,
  type PermissionRequest,
  type PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import { extractZodError } from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError, type SnapsProvider } from '@metamask/snaps-sdk';

import type {
  OrchestrateMeta,
  Orchestrator,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from './types';

/**
 * Maps permission types to their corresponding Zod object validators.
 */
const zodObjectMapper = {
  'native-token-stream': zNativeTokenStreamPermission,
};

/**
 * Parses a permission request and returns the permission object.
 *
 * @param basePermissionRequest - The permission request object.
 * @param permissionType - The permission type.
 * @returns The permission object.
 * @throws An error if the permission in the request is invalid.
 * @throws An error if the permission type is not supported.
 */
const parsePermission = <TPermissionType extends SupportedPermissionTypes>(
  basePermissionRequest: PermissionRequest,
  permissionType: TPermissionType,
): PermissionTypeMapping[TPermissionType] => {
  const zValaidatorKey = permissionType as keyof typeof zodObjectMapper;
  const zValaidator = zodObjectMapper[zValaidatorKey];
  if (!zValaidator) {
    throw new Error(
      `Validation for Permission type ${permissionType} is not supported`,
    );
  }

  const validateRes = zValaidator.safeParse(basePermissionRequest.permission);
  if (!validateRes.success) {
    throw new InvalidParamsError(extractZodError(validateRes.error.errors));
  }

  return validateRes.data as PermissionTypeMapping[typeof permissionType];
};

/**
 * Validates a permission object data specific to the permission type.
 *
 * @param _permission - The permission object.
 * @param _permissionType - The permission type.
 * @returns True if the permission object data is valid.
 * @throws An error if the permission object data is invalid.
 */
const validatePermissionData = <
  TPermissionType extends SupportedPermissionTypes,
>(
  _permission: PermissionTypeMapping[TPermissionType],
  _permissionType: TPermissionType,
): true => {
  // TODO: Implement permission.data validation for the native-token-stream permission type
  return true;
};

/**
 * Factory function for create a permission orchestrator for a specific permission type.
 *
 * @param _snapsProvider - A snaps provider instance.
 * @param _accountController - An account controller instance.
 * @param permissionType - The permission type.
 * @returns A permission orchestrator for the native-token-stream permission type.
 */
export const createPermissionOrchestrator = <
  TPermissionType extends SupportedPermissionTypes,
>(
  _snapsProvider: SnapsProvider,
  _accountController: unknown,
  permissionType: TPermissionType,
): Orchestrator<TPermissionType> => {
  return {
    parseAndValidate: async (basePermissionRequest: PermissionRequest) => {
      const validatedPermission = parsePermission(
        basePermissionRequest,
        permissionType,
      );
      validatePermissionData(validatedPermission, permissionType);

      return validatedPermission;
    },
    orchestrate: async (_orchestrateMeta: OrchestrateMeta<TPermissionType>) => {
      // TODO: Implement Specific permission orchestrator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/42
      return {
        success: true,
        response: {} as PermissionResponse,
      };
    },
  };
};
