import type { Hex, Delegation } from '@metamask/delegation-core';

/**
 * Base options required for account operations.
 */
export type AccountOptionsBase = {
  // really this needs to be of type SupportedChainId, but it makes it hard for callers to validate
  chainId: number;
};

/**
 * Options for signing a delegation.
 */
export type SignDelegationOptions = AccountOptionsBase & {
  delegation: Omit<Delegation, 'signature'>;
  address: Hex;
};

/**
 * Factory arguments for smart account deployment.
 */
export type FactoryArgs = {
  factory: Hex | undefined;
  factoryData: Hex | undefined;
};

/**
 * Interface for account controller implementations.
 */
export type AccountController = {
  /**
   * Retrieves the account address for the current account.
   */
  getAccountAddress(options: AccountOptionsBase): Promise<Hex>;

  /**
   * Signs a delegation using the smart account.
   */
  signDelegation(options: SignDelegationOptions): Promise<Delegation>;

  /**
   * Retrieves the metadata for deploying a smart account.
   */
  getAccountMetadata(options: AccountOptionsBase): Promise<FactoryArgs>;
};
