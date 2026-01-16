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

  /**
   * This method is used by MetaMask origin to submit a revocation and update the isRevoked flag.
   */
  PermissionsProviderSubmitRevocation = 'permissionsProvider_submitRevocation',

  /**
   * This method is used by the kernel to get supported permission types and rule types.
   */
  PermissionsProviderGetSupportedPermissions = 'permissionsProvider_getSupportedPermissions',
}
