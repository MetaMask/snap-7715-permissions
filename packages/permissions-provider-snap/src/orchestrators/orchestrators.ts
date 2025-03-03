/* eslint-disable @typescript-eslint/no-throw-literal */
import {
  zNativeTokenStreamPermission,
  type PermissionRequest,
} from '@metamask/7715-permissions-shared/types';
import {
  extractPermissionName,
  extractZodError,
} from '@metamask/7715-permissions-shared/utils';
import { InvalidParamsError, type SnapsProvider } from '@metamask/snaps-sdk';

import type {
  OrchestrateMeta,
  Orchestrator,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from './orchestrator.types';

/**
 * Parses a permission request and returns the permission object.
 *
 * @param basePermissionRequest - The permission request object.
 * @returns The permission object.
 * @throws An error if the permission in the request is invalid.
 * @throws An error if the permission type is not supported.
 */
const parsePermission = <TPermissionType extends SupportedPermissionTypes>(
  basePermissionRequest: PermissionRequest,
): PermissionTypeMapping[TPermissionType] => {
  const zodObjectMapper = {
    'native-token-stream': zNativeTokenStreamPermission,
  };

  const permissionType = extractPermissionName(
    basePermissionRequest.permission.type,
  ) as keyof typeof zodObjectMapper;

  const zValaidator = zodObjectMapper[permissionType];
  if (!zValaidator) {
    throw new Error(
      `Validation for Permission type ${permissionType} is not supported`,
    );
  }

  const validateRes = zValaidator.safeParse(basePermissionRequest.permission);
  if (!validateRes.success) {
    throw new InvalidParamsError(extractZodError(validateRes.error.errors));
  }

  return validateRes.data as PermissionTypeMapping[TPermissionType];
};

/**
 * Validates a permission object data specific to the permission type.
 *
 * @param _permission - The permission object.
 * @returns True if the permission object data is valid.
 * @throws An error if the permission object data is invalid.
 */
const validatePermissionData = <
  TPermissionType extends SupportedPermissionTypes,
>(
  _permission: PermissionTypeMapping[TPermissionType],
): true => {
  // TODO: Implement permission.data validation for the native-token-stream permission type
  return true;
};

/**
 * Factory function for create a permission orchestrator for a specific permission type.
 *
 * @param _snapsProvider - A snaps provider instance.
 * @param _accountController - An account controller instance.
 * @returns A permission orchestrator for the native-token-stream permission type.
 */
export const createPermissionOrchestrator = <
  TPermissionType extends SupportedPermissionTypes,
>(
  _snapsProvider: SnapsProvider,
  _accountController: unknown,
): Orchestrator<TPermissionType> => {
  let passedValidation = false;
  return {
    validate: async (basePermissionRequest: PermissionRequest) => {
      passedValidation = validatePermissionData(
        parsePermission(basePermissionRequest),
      );
      return passedValidation;
    },
    orchestrate: async (
      _permission: PermissionTypeMapping[TPermissionType],
      _orchestrateMeta: OrchestrateMeta,
    ) => {
      if (!passedValidation) {
        throw new Error(
          'Permission has not been validated, call validate before orchestrate',
        );
      }

      // TODO: Implement Specific permission orchestrator: https://app.zenhub.com/workspaces/readable-permissions-67982ce51eb4360029b2c1a1/issues/gh/metamask/delegator-readable-permissions/42
      return null;
    },
  };
};
