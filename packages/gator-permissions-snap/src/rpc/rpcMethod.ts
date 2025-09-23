/*
  Defines the permission for the Gator keyring and internal methods to restrict access to specific sites and snaps origins
*/
export enum RpcMethod {
  /**
   * This method is used by the kernel to request a permissions provider to get its permission offers.
   */
  PermissionsProviderGetPermissionOffers = 'permissionsProvider_getPermissionOffers',

  /**
   * This method is used by the kernel to request a permissions provider to grant attenuated permissions to a site.
   */
  PermissionsProviderGrantPermissions = 'permissionsProvider_grantPermissions',

  /**
   * This method is used by Metamask clients to retrieve granted permissions for all sites.
   */
  PermissionsProviderGetGrantedPermissions = 'permissionsProvider_getGrantedPermissions',
}
