/*
  Defines the permission for the Gator keyring and internal methods to restrict access to specific sites and snaps origins
*/
export enum RpcMethod {
  /**
   * This method is used by sites to request permissions where the kernel will map the request to the appropriate permissions provider.
   */
  WalletRequestExecutionPermissions = 'wallet_requestExecutionPermissions',

  /**
   * This method is used by sites to get the supported permission types and rule types from the wallet.
   */
  WalletGetSupportedExecutionPermissions = 'wallet_getSupportedExecutionPermissions',

  /**
   * This method is used by sites to retrieve previously granted permissions filtered by site origin.
   */
  WalletGetGrantedExecutionPermissions = 'wallet_getGrantedExecutionPermissions',
}

export enum ExternalMethod {
  /**
   * This method is used by the kernel to request a permissions provider to get its permission offers.
   */
  PermissionsProviderGetPermissionOffers = 'permissionsProvider_getPermissionOffers',

  /**
   * This method is used by the kernel to request a permissions provider to grant attenuated permissions to a site.
   */
  PermissionsProviderGrantPermissions = 'permissionsProvider_grantPermissions',

  /**
   * This method is used by the kernel to request a permissions provider to get granted permissions.
   */
  PermissionsProviderGetGrantedPermissions = 'permissionsProvider_getGrantedPermissions',

  /**
   * This method is used by the kernel to request a permissions provider to get supported permissions.
   */
  PermissionsProviderGetSupportedPermissions = 'permissionsProvider_getSupportedPermissions',
}
