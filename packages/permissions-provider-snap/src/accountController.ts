import {
  Implementation,
  toMetaMaskSmartAccount,
  type DelegationStruct,
  type MetaMaskSmartAccount,
} from '@metamask-private/delegator-core-viem';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { Logger } from 'src/logger';
import { createClient, custom, extractChain, type Chain, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const GET_ENTROPY_SALT = '7715_permissions_provider_snap';
const MULTISIG_THRESHOLD = 1n;

/**
 * Factory arguments for smart account deployment.
 */
export type FactoryArgs = {
  factory: Hex | undefined;
  factoryData: Hex | undefined;
};

// todo either narrow this or remove entirely
type ChainId = number;

/**
 * Base options required for account operations.
 */
export type AccountOptionsBase = {
  chainId: ChainId;
};

/**
 * Options for signing a delegation.
 */
export type SignDelegationOptions = AccountOptionsBase & {
  delegation: Omit<DelegationStruct, 'signature'>;
};

/**
 * Public interface of the AccountController class.
 */
export type AccountControllerInterface = Pick<
  AccountController,
  | 'getAccountAddress'
  | 'signDelegation'
  | 'getAccountMetadata'
  | 'getAccountBalance'
>;

/**
 * Controls smart account operations including creation, delegation signing, and balance queries.
 */
export class AccountController {
  #snapsProvider: SnapsProvider;

  #supportedChains: Chain[];

  #deploymentSalt: Hex;

  #metaMaskSmartAccountByChainId: Record<
    ChainId,
    Promise<MetaMaskSmartAccount<Implementation.MultiSig>>
  > = {};

  #logger: Logger;

  /**
   * Initializes a new AccountController instance.
   *
   * @param config - The configuration object.
   * @param config.snapsProvider - The provider for interacting with snaps.
   * @param config.supportedChains - The supported blockchain chains.
   * @param config.deploymentSalt - The hex salt for smart account deployment.
   * @param config.logger - The logger instance.
   */
  constructor(config: {
    snapsProvider: SnapsProvider;
    supportedChains: Chain[];
    deploymentSalt: Hex;
    logger: Logger;
  }) {
    this.#snapsProvider = config.snapsProvider;
    this.#supportedChains = config.supportedChains;
    this.#deploymentSalt = config.deploymentSalt;
    this.#logger = config.logger;
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
    this.#logger.debug('accountController:getMetaMaskSmartAccount()');

    const { chainId } = options;

    let smartAccount = this.#metaMaskSmartAccountByChainId[chainId];

    this.#logger.debug(
      'accountController:getMetaMaskSmartAccount() - smartAccount',
      smartAccount,
    );

    if (!smartAccount) {
      this.#logger.debug(
        'accountController:getMetaMaskSmartAccount() - smartAccount not found',
      );

      // @ts-expect-error -- viem extractChain does not work well with dynamic chains
      const chain = extractChain({
        chains: this.#supportedChains,
        id: chainId,
      });

      if (!chain) {
        this.#logger.error(
          'accountController:getMetaMaskSmartAccount() - chain not supported',
          { chainId },
        );

        throw new Error(`Chain not supported: ${chainId}`);
      }

      const provider = this.#createExperimentalProviderRequestProvider(chainId);

      const client = createClient({
        transport: custom(provider),
        chain,
      });

      smartAccount = (async () => {
        const entropy = await this.#snapsProvider.request({
          method: 'snap_getEntropy',
          params: { version: 1, salt: GET_ENTROPY_SALT },
        });

        this.#logger.debug('entropy received', entropy);

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
   * Creates a provider that handles experimental provider requests.
   *
   * @param chainId - The chain ID for the provider.
   * @returns A provider object with a request method.
   * @private
   */
  #createExperimentalProviderRequestProvider(chainId: ChainId) {
    return {
      request: async (request: { method: string; params?: unknown[] }) => {
        this.#logger.debug(
          'accountController:createExperimentalProviderRequestProvider() - provider.request()',
          request,
        );

        // we can just pass the request to the snapsProvider, because
        // snap_experimentalProviderRequest enforcesan allowlist of methods.
        const result = await this.#snapsProvider.request({
          // @ts-expect-error -- snap_experimentalProviderRequest are not defined in SnapMethods
          method: 'snap_experimentalProviderRequest',
          params: {
            // @ts-expect-error -- snap_experimentalProviderRequest are not defined in SnapMethods
            chainId: `eip155:${chainId}`,
            // @ts-expect-error -- snap_experimentalProviderRequest are not defined in SnapMethods
            request,
          },
        });

        return result;
      },
    };
  }

  /**
   * Retrieves the account address for the current account.
   *
   * @param options - The base account options including chainId.
   * @returns A promise resolving to the account address as a hex string.
   */
  public async getAccountAddress(options: AccountOptionsBase): Promise<Hex> {
    this.#logger.debug('accountController:getAccountAddress()');

    const smartAccount = await this.#getMetaMaskSmartAccount(options);

    const address = await smartAccount.getAddress();

    this.#logger.debug(
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

    this.#logger.debug(
      'accountController:getAccountMetadata() - factoryArgs resolved',
      factoryArgs,
    );

    return {
      factory: factoryArgs.factory,
      factoryData: factoryArgs.factoryData,
    };
  }

  /**
   * Retrieves the balance of the smart account.
   *
   * @param options - The base account options including chainId.
   * @returns A promise resolving to the account balance as a hex string.
   */
  public async getAccountBalance(options: AccountOptionsBase): Promise<Hex> {
    this.#logger.debug('accountController:getAccountBalance()');

    const { chainId } = options;

    const smartAccount = await this.#getMetaMaskSmartAccount(options);

    this.#logger.debug(
      'accountController:getAccountBalance() - smartAccount resolved',
      smartAccount,
    );

    const provider = this.#createExperimentalProviderRequestProvider(chainId);

    const accountAddress = await smartAccount.getAddress();

    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [accountAddress, 'latest'],
    });

    this.#logger.debug(
      'accountController:getAccountBalance() - balance resolved',
      balance,
    );

    return balance as Hex;
  }

  /**
   * Signs a delegation using the smart account.
   *
   * @param options - The options for signing including chainId and delegation data.
   * @returns A promise resolving to the signed delegation structure.
   */
  public async signDelegation(
    options: SignDelegationOptions,
  ): Promise<DelegationStruct> {
    this.#logger.debug('accountController:signDelegation()');

    const { chainId, delegation } = options;

    const smartAccount = await this.#getMetaMaskSmartAccount({ chainId });

    this.#logger.debug(
      'accountController:signDelegation() - smartAccount resolved',
      smartAccount,
    );

    const signature = await smartAccount.signDelegation({
      delegation,
      chainId,
    });

    this.#logger.debug(
      'accountController:signDelegation() - signature resolved',
    );

    return { ...delegation, signature };
  }
}
