/*
  Defines the permission for the Gator keyring and internal methods to restrict access to specific sites and snaps origins
*/
export enum RpcMethod {
  // debug
  Ping = 'ping',

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
