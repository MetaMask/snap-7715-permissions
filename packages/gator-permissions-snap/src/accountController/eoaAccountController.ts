import { logger } from '@metamask/7715-permissions-shared/utils';
import type { SnapsEthereumProvider, SnapsProvider } from '@metamask/snaps-sdk';
import { type Hex, type Delegation } from '@metamask/delegation-core';
import { getDelegationContracts } from '../core/delegationContracts';

import { BaseAccountController } from './baseAccountController';
import type {
  AccountController,
  AccountOptionsBase,
  SignDelegationOptions,
  FactoryArgs,
} from './types';

/**
 * Controls EOA account operations including address retrieval, delegation signing, and balance queries.
 */
export class EoaAccountController
  extends BaseAccountController
  implements AccountController
{
  #accountAddress: Hex | null = null;

  #ethereumProvider: SnapsEthereumProvider;

  /**
   * Initializes a new EoaAccountController instance.
   * @param config - The configuration object for the controller.
   * @param config.snapsProvider - The provider for interacting with snaps.
   * @param config.ethereumProvider - The provider for interacting with Ethereum.
   * @param config.supportedChains - Optional list of supported blockchain chains.
   */
  constructor(config: {
    snapsProvider: SnapsProvider;
    ethereumProvider: SnapsEthereumProvider;
    supportedChains: readonly number[];
  }) {
    super(config);

    this.#ethereumProvider = config.ethereumProvider;
  }

  /**
   * Gets the connected account address, requesting access if needed.
   * @returns The account address.
   */
  async #getAccountAddress(): Promise<Hex> {
    logger.debug('eoaAccountController:#getAccountAddress()');

    if (this.#accountAddress) {
      return this.#accountAddress;
    }

    const accounts = await this.#ethereumProvider.request<Hex[]>({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    this.#accountAddress = accounts[0] as Hex;

    return this.#accountAddress;
  }

  /**
   * Retrieves the account address for the current account.
   * @param options0 - The options object containing chain information.
   * @param options0.chainId - The ID of the blockchain chain.
   * @returns The account address.
   */
  public async getAccountAddress({
    chainId,
  }: AccountOptionsBase): Promise<Hex> {
    logger.debug('eoaAccountController:getAccountAddress()');

    this.assertIsSupportedChainId(chainId);

    return this.#getAccountAddress();
  }

  /**
   * Signs a delegation using the EOA account.
   * @param options - The options object containing delegation information.
   * @returns The signed delegation.
   */
  public async signDelegation(
    options: SignDelegationOptions,
  ): Promise<Delegation> {
    logger.debug('eoaAccountController:signDelegation()');

    const { chainId, delegation } = options;

    this.assertIsSupportedChainId(chainId);

    const address = await this.#getAccountAddress();

    const selectedChain = await this.#ethereumProvider.request<Hex>({
      method: 'eth_chainId',
      params: [],
    });

    if (Number(selectedChain) !== chainId) {
      throw new Error('Selected chain does not match the requested chain');
    }

    const { delegationManager } = getDelegationContracts({ chainId });

    const signArgs = this.#getSignDelegationArgs({
      chainId,
      delegationManager,
      delegation,
    });

    const signature = await this.#ethereumProvider.request<Hex>({
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
    delegationManager: Hex;
    delegation: Omit<Delegation, 'signature'>;
  }) {
    logger.debug('eoaAccountController:#getSignDelegationArgs()');

    const domain = {
      chainId,
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
   * @param options0 - The options object containing chain information.
   * @param options0.chainId - The ID of the blockchain chain.
   * @returns The factory arguments (undefined for EOA accounts).
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
}
