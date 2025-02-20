import { RpcMethod } from './rpcMethod';
import { config } from '@metamask/7715-permissions-shared';
/**
 * Verify if the caller can call the requested method.
 *
 * @param origin - Caller origin.
 * @param method - Method being called.
 * @returns True if the caller is allowed to call the method, false otherwise.
 */
export const isMethodAllowedForOrigin = (
  origin: string,
  method: string,
): boolean => {
  const allowedPermissions = allowedPermissionsByOrigin[origin];

  if (allowedPermissions && allowedPermissions.includes(method)) {
    return true;
  }

  return false;
};

const allowedPermissionsByOrigin: { [origin: string]: string[] } = {
  [config.KERNEL_SNAP_ID]: [
    RpcMethod.PermissionProviderGrantAttenuatedPermissions,
  ],
};
