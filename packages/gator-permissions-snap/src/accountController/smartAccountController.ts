import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Delegation } from '@metamask/delegation-core';
import {
  Implementation,
  toMetaMaskSmartAccount,
  type MetaMaskSmartAccount,
} from '@metamask/delegation-toolkit';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import { bigIntToHex, bytesToHex } from '@metamask/utils';
import {
  createClient,
  custom,
  extractChain,
  type Hex,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as chains from 'viem/chains';

import { BaseAccountController } from './baseAccountController';
import type {
  AccountController,
  AccountOptionsBase,
  SignDelegationOptions,
  FactoryArgs,
} from './types';

const ALL_CHAINS = Object.values(chains);

const GET_ENTROPY_SALT = '7715_permissions_provider_snap';
const MULTISIG_THRESHOLD = 1n;

const toHex = (input: Uint8Array | Hex): Hex => {
  if (typeof input === 'string') {
    return input;
  }

  return bytesToHex(input);
};

/**
 * Controls smart account operations including creation, delegation signing, and balance queries.
 */
export class SmartAccountController
  extends BaseAccountController
  implements AccountController
{
  #deploymentSalt: Hex;

  #metaMaskSmartAccountByChainId: Partial<
    Record<number, Promise<MetaMaskSmartAccount<Implementation.MultiSig>>>
  > = {};

  /**
   * Initializes a new SmartAccountController instance.
   *
   * @param config - The configuration object.
   * @param config.snapsProvider - The provider for interacting with snaps.
   * @param config.supportedChains - The supported blockchain chains.
   * @param config.deploymentSalt - The hex salt for smart account deployment.
   */
  constructor(config: {
    snapsProvider: SnapsProvider;
    supportedChains: readonly number[];
    deploymentSalt: Hex;
  }) {
    super(config);
    this.#deploymentSalt = config.deploymentSalt;
  }

  /**
   * Retrieves or creates a MetaMaskSmartAccount for the specified chain.
   *
   * @param options - The account options containing chain ID.
   * @returns A Promise resolving to a MetaMaskSmartAccount.
   * @throws When the specified chain is not supported.
   * @private
   */
  async #getMetaMaskSmartAccount(
    options: AccountOptionsBase,
  ): Promise<MetaMaskSmartAccount<Implementation.MultiSig>> {
    logger.debug('accountController:getMetaMaskSmartAccount()');

    const { chainId } = options;

    this.assertIsSupportedChainId(chainId);

    let smartAccount = this.#metaMaskSmartAccountByChainId[chainId];

    logger.debug(
      'accountController:getMetaMaskSmartAccount() - smartAccount',
      smartAccount,
    );

    if (!smartAccount) {
      logger.debug(
        'accountController:getMetaMaskSmartAccount() - smartAccount not found',
      );

      // @ts-expect-error - struggles with ALL_CHAINS
      const chain = extractChain({
        chains: ALL_CHAINS,
        id: chainId as (typeof ALL_CHAINS)[number]['id'],
      });

      if (!chain) {
        logger.error(
          'accountController:getMetaMaskSmartAccount() - chain not supported',
          { chainId },
        );

        throw new Error(`Chain not supported: ${chainId}`);
      }

      const provider = this.createExperimentalProviderRequestProvider(chainId);

      const client = createClient({
        transport: custom(provider),
        chain,
      });

      smartAccount = (async () => {
        const entropy = await this.snapsProvider.request({
          method: 'snap_getEntropy',
          params: { version: 1, salt: GET_ENTROPY_SALT },
        });

        logger.debug('entropy received', entropy);

        const account = privateKeyToAccount(entropy);

        return await toMetaMaskSmartAccount({
          implementation: Implementation.MultiSig,
          deployParams: [[account.address], MULTISIG_THRESHOLD],
          deploySalt: this.#deploymentSalt,
          signatory: [{ account }],
          client,
        });
      })();

      // `smartAccount` is asynchronous to ensure that subsequent callers wait
      // on the same smart account resolution. the entire function call up to
      // adding the smartAccount to #metaMaskSmartAccountByChainId must be
      // synchronous.
      this.#metaMaskSmartAccountByChainId[chainId] = smartAccount;
    }

    return smartAccount;
  }

  /**
   * Retrieves the account address for the current account.
   *
   * @param options - The base account options including chainId.
   * @returns A promise resolving to the account address as a hex string.
   */
  public async getAccountAddress(
    options: AccountOptionsBase,
  ): Promise<Address> {
    logger.debug('accountController:getAccountAddress()');

    const smartAccount = await this.#getMetaMaskSmartAccount(options);

    const address = await smartAccount.getAddress();

    logger.debug(
      'accountController:getAccountAddress() - address resolved',
      address,
    );

    return address;
  }

  /**
   * Retrieves the metadata for deploying a smart account.
   *
   * @param options - The base account options including chainId.
   * @returns A promise resolving to the factory arguments needed for deployment.
   */
  public async getAccountMetadata(
    options: AccountOptionsBase,
  ): Promise<FactoryArgs> {
    const smartAccount = await this.#getMetaMaskSmartAccount(options);

    const factoryArgs = await smartAccount.getFactoryArgs();

    logger.debug(
      'accountController:getAccountMetadata() - factoryArgs resolved',
      factoryArgs,
    );

    return {
      factory: factoryArgs.factory,
      factoryData: factoryArgs.factoryData,
    };
  }

  /**
   * Signs a delegation using the smart account.
   *
   * @param options - The options for signing including chainId and delegation data.
   * @returns A promise resolving to the signed delegation structure.
   */
  public async signDelegation(
    options: SignDelegationOptions,
  ): Promise<Delegation> {
    logger.debug('accountController:signDelegation()');

    const { chainId, delegation } = options;

    const smartAccount = await this.#getMetaMaskSmartAccount({ chainId });

    logger.debug(
      'accountController:signDelegation() - smartAccount resolved',
      smartAccount,
    );

    // smartAccount.signDelegation expects a developer friendly Delegation (salt: Hex)
    const toolkitDelegation = {
      delegate: toHex(delegation.delegate),
      delegator: toHex(delegation.delegator),
      authority: toHex(delegation.authority),
      caveats: delegation.caveats.map((caveat) => ({
        enforcer: toHex(caveat.enforcer),
        terms: toHex(caveat.terms),
        args: toHex(caveat.args),
      })),
      salt: bigIntToHex(delegation.salt),
    };

    const signature = await smartAccount.signDelegation({
      delegation: toolkitDelegation,
      chainId,
    });

    logger.debug('accountController:signDelegation() - signature resolved');

    // returns a raw Delegation
    return {
      ...toolkitDelegation,
      signature,
      salt: delegation.salt,
    };
  }
}
