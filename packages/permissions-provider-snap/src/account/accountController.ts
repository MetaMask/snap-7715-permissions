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

export type FactoryArgs = {
  factory: Hex | undefined;
  factoryData: Hex | undefined;
};

// todo either narrow this or remove entirely
type ChainId = number;

export type AccountOptionsBase = {
  chainId: ChainId;
};

export type SignDelegationOptions = AccountOptionsBase & {
  delegation: Omit<DelegationStruct, 'signature'>;
};

export type AccountControllerInterface = Pick<
  AccountController,
  | 'getAccountAddress'
  | 'signDelegation'
  | 'getAccountMetadata'
  | 'getAccountBalance'
>;

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

  //new Signer({ snapsProvider: this.#snapsProvider });
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

      this.#metaMaskSmartAccountByChainId[chainId] = smartAccount;
    }

    return smartAccount;
  }

  public async getAccountAddress(): Promise<Hex> {
    this.#logger.debug('accountController:getAddress()');

    return await this.#signer.getAddress();
  }

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

  public async getAccountBalance(options: AccountOptionsBase): Promise<Hex> {
    const smartAccount = await this.#getMetaMaskSmartAccount(options);

    this.#logger.debug('accountController:getAccountBalance()');

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

  public async signDelegation(
    options: SignDelegationOptions,
  ): Promise<DelegationStruct> {
    const { chainId, delegation } = options;

    const smartAccount = await this.#getMetaMaskSmartAccount({ chainId });

    const signature = await smartAccount.signDelegation({ delegation });

    return { ...delegation, signature };
  }
}
