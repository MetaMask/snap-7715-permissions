import { createClient, custom, extractChain, type Chain, type Hex } from 'viem';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import {
  Implementation,
  toMetaMaskSmartAccount,
  type DelegationStruct,
  type MetaMaskSmartAccount,
} from '@metamask-private/delegator-core-viem';
import type { Signer } from './signer';
import type { Logger } from 'src/logger';

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
 * Controller class for managing smart account operations.
 * Handles account creation, delegation signing, and balance queries across supported chains.
 */
export class AccountController {
  #snapsProvider: SnapsProvider;
  #signer: Signer;
  #supportedChains: Chain[];
  #deploymentSalt: Hex;
  #metaMaskSmartAccountByChainId: Record<
    ChainId,
    Promise<MetaMaskSmartAccount<Implementation.MultiSig>>
  > = {};
  #logger: Logger;

  /**
   * Creates a new AccountController instance.
   * @param config - Configuration object for the controller
   * @param config.snapsProvider - Provider for interacting with snaps environment
   * @param config.signer - Signer instance representing the account
   * @param config.supportedChains - Array of supported chains
   * @param config.deploymentSalt - Hex salt used for smart account deployment
   * @param config.logger - Logger instance
   */
  constructor(config: {
    snapsProvider: SnapsProvider;
    signer: Signer;
    supportedChains: Chain[];
    deploymentSalt: Hex;
    logger: Logger;
  }) {
    this.#snapsProvider = config.snapsProvider;
    this.#signer = config.signer;
    this.#supportedChains = config.supportedChains;
    this.#deploymentSalt = config.deploymentSalt;
    this.#logger = config.logger;
  }

  /**
   * Gets or creates a MetaMask smart account for the specified chain. Caches
   * the account promise, to ensure subsequent calls wait for the same account.
   * @param options - Options containing the chain ID
   * @returns Promise resolving to a MetaMask smart account instance
   * @throws Error if the specified chain is not supported
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

      // @ts-ignore -- extractChain does not work well with dynamic chains parameter
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

      const provider = {
        request: async (request: { method: string; params?: unknown[] }) => {
          this.#logger.debug(
            'accountController:getMetaMaskSmartAccount() - provider.request()',
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

      const client = createClient({
        transport: custom(provider),
        chain,
      });

      smartAccount = (async () => {
        const account = await this.#signer.toAccount();

        const signatory = {
          account,
        };

        return await toMetaMaskSmartAccount({
          implementation: Implementation.MultiSig,
          deployParams: [[signatory.account.address], 1n],
          deploySalt: this.#deploymentSalt,
          signatory: [signatory],
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
   * Gets the account address for the current signer.
   * @returns A promise that resolves to the account address as a hex string.
   */
  public async getAccountAddress(): Promise<Hex> {
    this.#logger.debug('accountController:getAccountAddress()');

    return await this.#signer.getAddress();
  }

  /**
   * Gets the metadata for deploying a smart account.
   * @param options - The base account options including chainId.
   * @returns A promise that resolves to the factory arguments needed for deployment.
   */
  public async getAccountMetadata(
    options: AccountOptionsBase,
  ): Promise<FactoryArgs> {
    const smartAccount = await this.#getMetaMaskSmartAccount(options);

    const factoryArgs = await smartAccount.getFactoryArgs();

    return {
      factory: factoryArgs.factory,
      factoryData: factoryArgs.factoryData,
    };
  }

  /**
   * Gets the balance of the smart account.
   * @param options - The base account options including chainId.
   * @returns A promise that resolves to the account balance as a hex string.
   */
  public async getAccountBalance(options: AccountOptionsBase): Promise<Hex> {
    this.#logger.debug('accountController:getAccountBalance()');
    const smartAccount = await this.#getMetaMaskSmartAccount(options);

    this.#logger.debug(
      'accountController:getAccountBalance() - smartAccount resolved',
      smartAccount,
    );

    const balance = await smartAccount.client.request({
      method: 'eth_getBalance',
      params: [await smartAccount.getAddress(), 'latest'],
    });

    this.#logger.debug(
      'accountController:getAccountBalance() - balance resolved',
      balance,
    );

    return balance;
  }

  /**
   * Signs a delegation using the smart account.
   * @param options - The options for signing including chainId and delegation data.
   * @returns A promise that resolves to the signed delegation structure.
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

    const signature = await smartAccount.signDelegation({ delegation });

    this.#logger.debug(
      'accountController:signDelegation() - signature resolved',
    );

    return { ...delegation, signature };
  }
}
