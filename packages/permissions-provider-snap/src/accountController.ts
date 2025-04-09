import {
  CHAIN_ID as ChainsWithDelegatorDeployed,
  Implementation,
  toMetaMaskSmartAccount,
  type Delegation,
  type DeleGatorEnvironment,
  type MetaMaskSmartAccount,
} from '@metamask-private/delegator-core-viem';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import {
  createClient,
  custom,
  extractChain,
  type Hex,
  type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as chains from 'viem/chains';

const GET_ENTROPY_SALT = '7715_permissions_provider_snap';
const MULTISIG_THRESHOLD = 1n;

type SupportedChains =
  (typeof chains)[keyof typeof ChainsWithDelegatorDeployed &
    keyof typeof chains][];

// all of the chainIds that have delegator contracts deployed
type SupportedChainId = SupportedChains[number]['id'];

// default for `supportedChains` configuration option
const ALL_SUPPORTED_CHAINS: SupportedChains = Object.keys(chains)
  .filter((name) => Object.keys(ChainsWithDelegatorDeployed).includes(name))
  .map(
    // we assert to any here due to the inability to infer the namespace of the global import
    (name) => (chains as any)[name as keyof typeof chains],
  ) as SupportedChains;

/**
 * Factory arguments for smart account deployment.
 */
export type FactoryArgs = {
  factory: Hex | undefined;
  factoryData: Hex | undefined;
};

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
 * Public interface of the AccountController class.
 */
export type AccountControllerInterface = Pick<
  AccountController,
  | 'getAccountAddress'
  | 'signDelegation'
  | 'getAccountMetadata'
  | 'getAccountBalance'
  | 'getDelegationManager'
  | 'getEnvironment'
>;

/**
 * Controls smart account operations including creation, delegation signing, and balance queries.
 */
export class AccountController {
  #snapsProvider: SnapsProvider;

  #supportedChains: SupportedChains;

  #deploymentSalt: Hex;

  #metaMaskSmartAccountByChainId: Partial<
    Record<
      SupportedChainId,
      Promise<MetaMaskSmartAccount<Implementation.MultiSig>>
    >
  > = {};

  /**
   * Initializes a new AccountController instance.
   *
   * @param config - The configuration object.
   * @param config.snapsProvider - The provider for interacting with snaps.
   * @param config.supportedChains - The supported blockchain chains.
   * @param config.deploymentSalt - The hex salt for smart account deployment.
   */
  constructor(config: {
    snapsProvider: SnapsProvider;
    supportedChains?: SupportedChains;
    deploymentSalt: Hex;
  }) {
    // only validate if supportedChains is specified, as it will default to ALL_SUPPORTED_CHAINS
    if (config.supportedChains) {
      this.#validateSupportedChains(config.supportedChains);
    }

    this.#snapsProvider = config.snapsProvider;
    this.#supportedChains = config.supportedChains ?? ALL_SUPPORTED_CHAINS;
    this.#deploymentSalt = config.deploymentSalt;
  }

  #validateSupportedChains(supportedChains: SupportedChains) {
    if (supportedChains.length === 0) {
      logger.error('No supported chains specified');
      throw new Error('No supported chains specified');
    }

    // Get chain names from config and check if they're supported by delegator
    const configuredChains = Object.keys(chains)
      .filter((name) => {
        // assert chains to any here due to the inability to infer the namespace of the global import
        const chain = (chains as any)[name as keyof typeof chains];
        return supportedChains.some(
          (supportedChain) => supportedChain.id === chain.id,
        );
      })
      .map((name) => name.toLowerCase());

    const chainsWithDelegatorDeployed = Object.keys(
      ChainsWithDelegatorDeployed,
    ).map((name) => name.toLowerCase());

    const unsupportedChains = configuredChains.filter(
      (chain) => !chainsWithDelegatorDeployed.includes(chain),
    );

    if (unsupportedChains.length > 0) {
      logger.error('Unsupported chains specified', unsupportedChains);
      throw new Error(
        `Unsupported chains specified: ${unsupportedChains.join(', ')}`,
      );
    }
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

    this.#assertIsSupportedChainId(chainId);

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
        chains: this.#supportedChains,
        id: chainId,
      });

      if (!chain) {
        logger.error(
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

  #assertIsSupportedChainId(
    chainId: number,
  ): asserts chainId is SupportedChainId {
    if (!this.#supportedChains.some((chain) => chain.id === chainId)) {
      logger.error(
        'accountController:assertIsSupportedChainId() - unsupported chainId',
        {
          chainId,
        },
      );
      throw new Error(`Unsupported ChainId: ${chainId}`);
    }
  }

  /**
   * Creates a provider that handles experimental provider requests.
   *
   * @param chainId - The chain ID for the provider.
   * @returns A provider object with a request method.
   * @private
   */
  #createExperimentalProviderRequestProvider(chainId: SupportedChainId) {
    return {
      request: async (request: { method: string; params?: unknown[] }) => {
        logger.debug(
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
   * Retrieves the balance of the smart account.
   *
   * @param options - The base account options including chainId.
   * @returns A promise resolving to the account balance as a hex string.
   */
  public async getAccountBalance(options: AccountOptionsBase): Promise<Hex> {
    logger.debug('accountController:getAccountBalance()');

    const { chainId } = options;

    const smartAccount = await this.#getMetaMaskSmartAccount(options);

    logger.debug(
      'accountController:getAccountBalance() - smartAccount resolved',
      smartAccount,
    );

    this.#assertIsSupportedChainId(chainId);

    const provider = this.#createExperimentalProviderRequestProvider(chainId);

    const accountAddress = await smartAccount.getAddress();

    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [accountAddress, 'latest'],
    });

    logger.debug(
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
}
