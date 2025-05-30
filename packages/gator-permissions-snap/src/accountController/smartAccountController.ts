import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  Implementation,
  toMetaMaskSmartAccount,
  type Delegation,
  type DeleGatorEnvironment,
  type MetaMaskSmartAccount,
} from '@metamask/delegation-toolkit';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import {
  createClient,
  custom,
  extractChain,
  type Hex,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { AccountApiClient } from '../clients/accountApiClient';
import type { SupportedChains } from './baseAccountController';
import { BaseAccountController } from './baseAccountController';
import type {
  AccountController,
  AccountOptionsBase,
  SignDelegationOptions,
  FactoryArgs,
} from './types';

const GET_ENTROPY_SALT = '7715_permissions_provider_snap';
const MULTISIG_THRESHOLD = 1n;

type SupportedChainId = SupportedChains[number]['id'];

/**
 * Controls smart account operations including creation, delegation signing, and balance queries.
 */
export class SmartAccountController
  extends BaseAccountController
  implements AccountController
{
  #deploymentSalt: Hex;

  #metaMaskSmartAccountByChainId: Partial<
    Record<
      SupportedChainId,
      Promise<MetaMaskSmartAccount<Implementation.MultiSig>>
    >
  > = {};

  /**
   * Initializes a new SmartAccountController instance.
   *
   * @param config - The configuration object.
   * @param config.snapsProvider - The provider for interacting with snaps.
   * @param config.supportedChains - The supported blockchain chains.
   * @param config.deploymentSalt - The hex salt for smart account deployment.
   * @param config.accountApiClient - The client for interacting with the account API.
   */
  constructor(config: {
    snapsProvider: SnapsProvider;
    supportedChains?: SupportedChains;
    deploymentSalt: Hex;
    accountApiClient: AccountApiClient;
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

      // @ts-expect-error - extractChain does not work well with dynamic `chains`
      const chain = extractChain({
        chains: this.supportedChains,
        id: chainId,
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
   * Retrieves the delegation manager address for the current account.
   *
   * @param options - The base account options including chainId.
   * @returns A promise resolving to the delegation manager address as a hex string.
   */
  public async getDelegationManager(
    options: AccountOptionsBase,
  ): Promise<Address> {
    const smartAccount = await this.#getMetaMaskSmartAccount(options);

    // once we have multiple versions of the delegation manager supported, we
    // will need to validate and perhaps upgrade here
    return smartAccount.environment.DelegationManager;
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
   * Retrieves the environment for the current account.
   *
   * @param options - The base account options including chainId.
   * @returns A promise resolving to a DeleGatorEnvironment.
   */
  public async getEnvironment(
    options: AccountOptionsBase,
  ): Promise<DeleGatorEnvironment> {
    logger.debug('accountController:getEnvironment()');

    const smartAccount = await this.#getMetaMaskSmartAccount(options);

    logger.debug(
      'accountController:getEnvironment() - smartAccount resolved',
      smartAccount,
    );

    return smartAccount.environment;
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

    const signature = await smartAccount.signDelegation({
      delegation,
      chainId,
    });

    logger.debug('accountController:signDelegation() - signature resolved');

    return { ...delegation, signature };
  }
}
