export const KERNEL_SNAP_ID =
  // eslint-disable-next-line no-restricted-globals
  process.env.SNAP_ENV === 'production'
    ? 'npm:@metamask/permissions-kernel'
    : 'local:http://localhost:8080';

/*
  Defines the permission for the Gator keyring and internal methods to restrict access to specific sites and snaps origins
*/
export enum InternalMethod {
  /**
   * This method is used by snaps to offer its cryptographic abilities as permissions to kernel.
   */
  WalletOfferOnchainPermission = 'wallet_offerOnchainPermission',

  /**
   * This method is used by permissions provider to request the kernel to get the registered onchain permission offers.
   */
  WalletGetRegisteredOnchainPermissionOffers = 'wallet_getRegisteredOnchainPermissionOffers',

  /**
   * This method is used by the kernel to request a permissions provider to grant attenuated permissions to a site.
   */
  PermissionProviderGrantAttenuatedPermissions = 'permissionsProvider_grantAttenuatedPermissions',
}

export const originPermissions = new Map<string, string[]>([
  // Local kernel snap
  [
    KERNEL_SNAP_ID,
    [InternalMethod.PermissionProviderGrantAttenuatedPermissions],
  ],
]);

/**
 * Verify if the caller can call the requested method.
 *
 * @param origin - Caller origin.
 * @param method - Method being called.
 * @returns True if the caller is allowed to call the method, false otherwise.
 */
export const hasPermission = (origin: string, method: string): boolean => {
  return originPermissions.get(origin)?.includes(method) ?? false;
};
