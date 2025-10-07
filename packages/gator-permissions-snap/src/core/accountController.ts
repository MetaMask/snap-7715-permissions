import { logger } from '@metamask/7715-permissions-shared/utils';
import { type Hex, type Delegation } from '@metamask/delegation-core';
import {
  ChainDisconnectedError,
  InternalError,
  ResourceNotFoundError,
  ResourceUnavailableError,
  type SnapsEthereumProvider,
  type SnapsProvider,
} from '@metamask/snaps-sdk';
import { bigIntToHex, hexToNumber, numberToHex } from '@metamask/utils';

import { getChainMetadata } from './chainMetadata';
import type { SignDelegationOptions } from './types';

export type AccountUpgradeStatus = {
  isUpgraded: boolean;
};

export type AccountUpgradeResult = {
  transactionHash: string;
};

export type AccountUpgradeParams = {
  account: string;
  chainId: number;
};

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
      throw new ResourceNotFoundError('No accounts found');
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

    const { chainId, delegation, address, origin, justification } = options;

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
        throw new ChainDisconnectedError(
          'Selected chain does not match the requested chain',
        );
      }
    }

    const {
      contracts: { delegationManager },
    } = getChainMetadata({ chainId });

    const signArgs = this.#getSignDelegationArgs({
      chainId,
      delegationManager,
      delegation,
      origin,
      justification,
    });

    const signature = await this.#ethereumProvider.request<Hex>({
      method: 'eth_signTypedData_v4',
      params: [address, signArgs],
    });

    if (!signature) {
      throw new ResourceUnavailableError('Failed to sign delegation');
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
    origin,
    justification,
  }: {
    chainId: number;
    delegationManager: Hex;
    delegation: Omit<Delegation, 'signature'>;
    origin: string;
    justification: string;
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

    const metadata = {
      origin,
      justification,
    };

    const primaryType = 'Delegation';

    const message = { ...delegation, salt: bigIntToHex(delegation.salt) };

    return { domain, types, primaryType, message, metadata };
  }

  /**
   * Checks if the account is already upgraded to a smart account.
   * @param params - The account and chain ID to check.
   * @returns Promise resolving to the upgrade status.
   */
  public async getAccountUpgradeStatus(
    params: AccountUpgradeParams,
  ): Promise<AccountUpgradeStatus> {
    logger.debug('AccountController:getAccountUpgradeStatus()', params);

    try {
      const result = (await this.#ethereumProvider.request({
        method: 'wallet_getAccountUpgradeStatus',
        params: [params],
      })) as { isUpgraded: boolean; upgradedAddress: Hex | null };

      logger.debug('Account upgrade status result', result);

      const {
        contracts: { eip7702StatelessDeleGatorImpl },
      } = getChainMetadata({ chainId: params.chainId });

      return {
        isUpgraded:
          result.isUpgraded &&
          result.upgradedAddress?.toLowerCase() ===
            eip7702StatelessDeleGatorImpl.toLowerCase(),
      };
    } catch (error) {
      logger.error('Failed to check account upgrade status', error);
      throw new InternalError('Failed to check account upgrade status');
    }
  }

  /**
   * Upgrades the account to a smart account.
   * @param params - The account and chain ID to upgrade.
   * @returns Promise resolving to the upgrade result with transaction hash.
   */
  public async upgradeAccount(
    params: AccountUpgradeParams,
  ): Promise<AccountUpgradeResult> {
    logger.debug('AccountController:upgradeAccount()', params);

    try {
      const result = await this.#ethereumProvider.request({
        method: 'wallet_upgradeAccount',
        params: [params],
      });

      logger.debug('Account upgrade result', result);

      // The result should contain a transaction hash
      if (
        typeof result === 'object' &&
        result !== null &&
        'transactionHash' in result
      ) {
        return {
          transactionHash: (result as { transactionHash: string })
            .transactionHash,
        };
      }

      throw new Error('Invalid upgrade result: missing transaction hash');
    } catch (error) {
      logger.error('Failed to upgrade account', error);
      throw new InternalError('Failed to upgrade account');
    }
  }
}
