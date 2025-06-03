/**
 * TODO:
 * / Defaulting to only grant permissions from the gator-snap, but eventually we would need to adjust to allow other permission providers
 */
export const PERMISSIONS_PROVIDER_SNAP_ID =
  // eslint-disable-next-line no-restricted-globals
  process.env.SNAP_ENV === 'production'
    ? 'npm:@metamask/gator-permissions-snap'
    : 'local:http://localhost:8082';

export enum InternalMethod {
  /**
   * This method is used by sites to request permissions where the kernel will map the request to the appropriate permissions provider.
   */
  WalletGrantPermissions = 'wallet_grantPermissions',

  /**
   * This method is used by snaps to offer its cryptographic abilities as permissions.
   */
  WalletOfferOnchainPermission = 'wallet_offerOnchainPermission',

  /**
   * This method is used by the kernel to request a permissions provider to get its permission offers.
   */
  PermissionProviderGetPermissionOffers = 'permissionProvider_getPermissionOffers',

  /**
   * This method is used by the kernel to request a permissions provider to grant attenuated permissions to a site.
   */
  PermissionProviderGrantAttenuatedPermissions = 'permissionsProvider_grantAttenuatedPermissions',
}
