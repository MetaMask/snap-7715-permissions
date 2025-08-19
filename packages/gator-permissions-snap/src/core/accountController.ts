import { logger } from '@metamask/7715-permissions-shared/utils';
import { type Hex, type Delegation } from '@metamask/delegation-core';
import type { SnapsEthereumProvider, SnapsProvider } from '@metamask/snaps-sdk';
import { bigIntToHex, hexToNumber, numberToHex } from '@metamask/utils';

import { getChainMetadata } from './chainMetadata';
import type { SignDelegationOptions } from './types';

/**
 * Controls EOA account operations including address retrieval, delegation signing, and balance queries.
 */
export class AccountController {
  #ethereumProvider: SnapsEthereumProvider;

  /**
   * Initializes a new AccountController instance.
   * @param config - The configuration object for the controller.
   * @param config.snapsProvider - The provider for interacting with snaps.
   * @param config.ethereumProvider - The provider for interacting with Ethereum.
   */
  constructor(config: {
    snapsProvider: SnapsProvider;
    ethereumProvider: SnapsEthereumProvider;
  }) {
    this.#ethereumProvider = config.ethereumProvider;
  }

  /**
   * Retrieves the account addresses available for this current account.
   * @returns The account addresses in CAIP-10 format.
   */
  public async getAccountAddresses(): Promise<[Hex, ...Hex[]]> {
    logger.debug('AccountController:getAccountAddresses()');

    const accounts = await this.#ethereumProvider.request<Hex[]>({
      method: 'eth_requestAccounts',
    });

    if (
      !accounts ||
      accounts.length === 0 ||
      accounts.some((account) => account === undefined)
    ) {
      throw new Error('No accounts found');
    }

    return accounts as [Hex, ...Hex[]];
  }

  /**
   * Signs a delegation using the EOA account.
   * @param options - The options object containing delegation information.
   * @returns The signed delegation.
   */
  public async signDelegation(
    options: SignDelegationOptions,
  ): Promise<Delegation> {
    logger.debug('AccountController:signDelegation()');

    const { chainId, delegation, address } = options;

    const selectedChain = await this.#ethereumProvider.request<Hex>({
      method: 'eth_chainId',
      params: [],
    });

    if (selectedChain && hexToNumber(selectedChain) !== chainId) {
      await this.#ethereumProvider.request<Hex>({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: numberToHex(chainId) }],
      });

      const updatedChain = await this.#ethereumProvider.request<Hex>({
        method: 'eth_chainId',
        params: [],
      });

      if (updatedChain && hexToNumber(updatedChain) !== chainId) {
        throw new Error('Selected chain does not match the requested chain');
      }
    }

    const {
      contracts: { delegationManager },
    } = getChainMetadata({ chainId });

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
    logger.debug('AccountController:#getSignDelegationArgs()');

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

    const message = { ...delegation, salt: bigIntToHex(delegation.salt) };

    return { domain, types, primaryType, message };
  }
}
