/*
  Defines the permission for the Gator keyring and internal methods to restrict access to specific sites and snaps origins
*/
export enum RpcMethod {
  /**
   * This method is used by the kernel to request a permissions provider to get its permission offers.
   */
  PermissionProviderGetPermissionOffers = 'permissionProvider_getPermissionOffers',

  /**
   * This method is used by the kernel to request a permissions provider to grant attenuated permissions to a site.
   */
  PermissionProviderGrantPermissions = 'permissionsProvider_grantPermissions',

  /**
   * This method is used by the metamask to request a permissions provider to get the granted permissions for a all sites.
   */
  PermissionProviderGetGrantedPermissions = 'permissionsProvider_getGrantedPermissions',
}
