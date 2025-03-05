import type {
  PermissionCaseHandler,
  PermissionTypeMapping,
  SupportedPermissionTypes,
} from '../orchestrators/types';

/**
 * Generic dispatcher for permission cases based on the permission type.
 * Will execute the correct handler based on the permission type.
 *
 * @param permissionType - The permission type to handle.
 * @param permission - The permission to handle.
 * @param handlers - The handlers for each permission type.
 * @param errorMesssage - The error message to throw if the permission type is not supported.
 * @returns The result of the permission case handler.
 */
export const handlePermissionCase = <
  TPermissionType extends SupportedPermissionTypes,
  TReturnType,
>(
  permissionType: TPermissionType,
  permission: PermissionTypeMapping[TPermissionType],
  handlers: PermissionCaseHandler<TPermissionType, TReturnType>,
  errorMesssage: string,
): TReturnType => {
  if (permissionType in handlers) {
    // execute the handler for the permission type
    return handlers[permissionType](permission);
  }
  throw new Error(errorMesssage);
};
