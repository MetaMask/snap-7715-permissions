import { logger } from '@metamask/7715-permissions-shared/utils';

import { RpcMethod } from './rpcMethod';

const allowedPermissionsByOrigin: { [origin: string]: string[] } = {
  // eslint-disable-next-line no-restricted-globals
  ...(process.env.KERNEL_SNAP_ID && {
    // eslint-disable-next-line no-restricted-globals
    [process.env.KERNEL_SNAP_ID]: [
      RpcMethod.PermissionsProviderGrantPermissions,
      RpcMethod.PermissionsProviderGetPermissionOffers,
    ],
  }),
  metamask: [
    RpcMethod.PermissionsProviderGetGrantedPermissions,
    RpcMethod.PermissionsProviderSubmitRevocation,
  ],
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
  logger.debug('🔍 Checking origin permissions:', {
    origin,
    method,
    originCharCodes: origin.split('').map((c) => c.charCodeAt(0)),
    allowedOrigins: Object.keys(allowedPermissionsByOrigin),
    allowedMethodsForOrigin: allowedPermissionsByOrigin[origin],
    exactMatch: allowedPermissionsByOrigin[origin],
    includesCheck: allowedPermissionsByOrigin[origin]?.includes(method),
  });

  const isAllowed =
    allowedPermissionsByOrigin[origin]?.includes(method) ?? false;

  logger.debug('🔍 Permission check result:', {
    origin,
    method,
    isAllowed,
  });

  return isAllowed;
};
