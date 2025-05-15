import { logger } from '@metamask/7715-permissions-shared/utils';
import { type Address, type Hex } from 'viem';
import {
  getDeleGatorEnvironment,
  type Delegation,
  type DeleGatorEnvironment,
} from '@metamask/delegation-toolkit';
import type {
  AccountController,
  AccountOptionsBase,
  SignDelegationOptions,
  FactoryArgs,
} from './types';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import {
  BaseAccountController,
  SupportedChains,
} from './baseAccountController';

export type EthereumProvider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
};

/**
 * Controls EOA account operations including address retrieval, delegation signing, and balance queries.
 */
export class EoaAccountController
  extends BaseAccountController
  implements AccountController
{
  #accountAddress: Address | null = null;
  #ethereumProvider: EthereumProvider;

  /**
   * Initializes a new EoaAccountController instance.
   */
  constructor(config: {
    snapsProvider: SnapsProvider;
    ethereumProvider: EthereumProvider;
    supportedChains?: SupportedChains;
  }) {
    super(config);
    this.#ethereumProvider = config.ethereumProvider;
  }

  /**
   * Gets the connected account address, requesting access if needed.
   */
  async #getAccountAddress(): Promise<Address> {
    logger.debug('eoaAccountController:#getAccountAddress()');

    if (this.#accountAddress) {
      return this.#accountAddress;
    }

    const accounts = await this.#ethereumProvider.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    this.#accountAddress = accounts[0] as Address;
    return this.#accountAddress;
  }

  /**
   * Retrieves the account address for the current account.
   */
  public async getAccountAddress({
    chainId,
  }: AccountOptionsBase): Promise<Address> {
    logger.debug('eoaAccountController:getAccountAddress()');

    this.assertIsSupportedChainId(chainId);

    return this.#getAccountAddress();
  }

  /**
   * Signs a delegation using the EOA account.
   */
  public async signDelegation(
    options: SignDelegationOptions,
  ): Promise<Delegation> {
    logger.debug('eoaAccountController:signDelegation()');

    const { chainId, delegation } = options;

    this.assertIsSupportedChainId(chainId);

    const address = await this.#getAccountAddress();

    const selectedChain = await this.#ethereumProvider.request({
      method: 'eth_chainId',
      params: [],
    });

    if (Number(selectedChain) !== chainId) {
      throw new Error('Selected chain does not match the requested chain');
    }

    const delegationManager = await this.getDelegationManager(options);
    const signArgs = this.#getSignDelegationArgs({
      chainId,
      delegationManager,
      delegation,
    });

    const signature = await this.#ethereumProvider.request({
      method: 'eth_signTypedData_v4',
      params: [address, signArgs],
    });

    if (!signature) {
      throw new Error('Failed to sign delegation');
    }

    return {
      ...options.delegation,
      signature,
    };
  }

  #getSignDelegationArgs({
    chainId,
    delegationManager,
    delegation,
  }: {
    chainId: number;
    delegationManager: Address;
    delegation: Omit<Delegation, 'signature'>;
  }) {
    logger.debug('eoaAccountController:#getSignDelegationArgs()');

    const domain = {
      chainId: chainId,
      name: 'DelegationManager',
      version: '1',
      verifyingContract: delegationManager,
    };

    const types = {
      Caveat: [
        { name: 'enforcer', type: 'address' },
        { name: 'terms', type: 'bytes' },
      ],
      Delegation: [
        { name: 'delegate', type: 'address' },
        { name: 'delegator', type: 'address' },
        { name: 'authority', type: 'bytes32' },
        { name: 'caveats', type: 'Caveat[]' },
        { name: 'salt', type: 'uint256' },
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
    };

    const primaryType = 'Delegation';

    const message = delegation;

    return { domain, types, primaryType, message };
  }

  /**
   * Retrieves the metadata for deploying a smart account.
   * Not applicable for EOA accounts.
   */
  public async getAccountMetadata({
    chainId,
  }: AccountOptionsBase): Promise<FactoryArgs> {
    logger.debug('eoaAccountController:getAccountMetadata()');

    this.assertIsSupportedChainId(chainId);

    return {
      factory: undefined,
      factoryData: undefined,
    };
  }

  /**
   * Retrieves the balance of the EOA account.
   */
  public async getAccountBalance(options: AccountOptionsBase): Promise<Hex> {
    logger.debug('eoaAccountController:getAccountBalance()');

    this.assertIsSupportedChainId(options.chainId);

    const address = await this.#getAccountAddress();

    const provider = this.createExperimentalProviderRequestProvider(
      options.chainId,
    );

    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });

    return balance as Hex;
  }

  /**
   * Retrieves the delegation manager address.
   * Not applicable for EOA accounts.
   */
  public async getDelegationManager(
    options: AccountOptionsBase,
  ): Promise<Address> {
    logger.debug('eoaAccountController:getDelegationManager()');

    const { DelegationManager } = await this.getEnvironment(options);

    return DelegationManager;
  }

  /**
   * Retrieves the environment for the current account.
   * Not applicable for EOA accounts.
   */
  public async getEnvironment({
    chainId,
  }: AccountOptionsBase): Promise<DeleGatorEnvironment> {
    logger.debug('eoaAccountController:getEnvironment()');

    this.assertIsSupportedChainId(chainId);

    const environment = getDeleGatorEnvironment(chainId);

    return environment;
  }
}
