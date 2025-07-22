import { KERNEL_SNAP_ID } from '@metamask/7715-permissions-shared/constants';

import { RpcMethod } from './rpcMethod';

const allowedPermissionsByOrigin: { [origin: string]: string[] } = {
  [KERNEL_SNAP_ID]: [
    RpcMethod.PermissionProviderGrantPermissions,
    RpcMethod.PermissionProviderGetPermissionOffers,
  ],
  metamask: [RpcMethod.PermissionProviderGetGrantedPermissions],
};

/**
 * Verify if the caller can call the requested method.
 * @param origin - Caller origin.
 * @param method - Method being called.
 * @returns True if the caller is allowed to call the method, false otherwise.
 */
export const isMethodAllowedForOrigin = (
  origin: string,
  method: string,
): boolean => {
  return allowedPermissionsByOrigin[origin]?.includes(method) ?? false;
};
