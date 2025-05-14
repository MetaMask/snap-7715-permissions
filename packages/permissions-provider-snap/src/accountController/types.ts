import type { Address, Hex } from 'viem';
import type {
  Delegation,
  DeleGatorEnvironment,
} from '@metamask/delegation-toolkit';

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
  getAccountAddress(options: AccountOptionsBase): Promise<Address>;

  /**
   * Signs a delegation using the smart account.
   */
  signDelegation(options: SignDelegationOptions): Promise<Delegation>;

  /**
   * Retrieves the metadata for deploying a smart account.
   */
  getAccountMetadata(options: AccountOptionsBase): Promise<FactoryArgs>;

  /**
   * Retrieves the balance of the smart account.
   */
  getAccountBalance(options: AccountOptionsBase): Promise<Hex>;

  /**
   * Retrieves the delegation manager address for the current account.
   */
  getDelegationManager(options: AccountOptionsBase): Promise<Address>;

  /**
   * Retrieves the environment for the current account.
   */
  getEnvironment(options: AccountOptionsBase): Promise<DeleGatorEnvironment>;
};
