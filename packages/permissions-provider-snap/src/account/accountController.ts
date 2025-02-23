import { createClient, custom, extractChain, type Chain, type Hex } from 'viem';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import {
  Implementation,
  toMetaMaskSmartAccount,
  type DelegationStruct,
  type MetaMaskSmartAccount,
} from '@metamask-private/delegator-core-viem';
import type { Signer } from './signer';
import { mainnet } from 'viem/chains';

// todo either narrow this or remove entirely
type ChainId = number;

export type AccountOptionsBase = {
  chainId: ChainId;
};

export type SignDelegationOptions = AccountOptionsBase & {
  delegation: Exclude<DelegationStruct, 'signature'>;
};

export type AccountControllerInterface = Pick<
  AccountController,
  'getAccountAddress' | 'signDelegation'
>;

export class AccountController {
  #snapsProvider: SnapsProvider;
  #signer: Signer;
  #supportedChains: Chain[];
  #deploymentSalt: Hex;
  #metaMaskSmartAccountByChainId: Record<
    ChainId,
    MetaMaskSmartAccount<Implementation.MultiSig>
  > = {};

  //new Signer({ snapsProvider: this.#snapsProvider });
  constructor(config: {
    snapsProvider: SnapsProvider;
    signer: Signer;
    supportedChains: Chain[];
    deploymentSalt: Hex;
  }) {
    this.#snapsProvider = config.snapsProvider;
    this.#signer = config.signer;
    this.#supportedChains = config.supportedChains;
    this.#deploymentSalt = config.deploymentSalt;
  }

  async #getMetaMaskSmartAccount(
    options: AccountOptionsBase,
  ): Promise<MetaMaskSmartAccount<Implementation.MultiSig>> {
    const { chainId } = options;

    let smartAccount = this.#metaMaskSmartAccountByChainId[chainId];

    if (!smartAccount) {
      // todo: figure out what happens if this doesn't match a chain, and remove chainId assertion
      const chain = (extractChain as any)({
        chains: this.#supportedChains,
        id: chainId,
      });

      const provider = {
        request: async (request: { method: string; params?: unknown[] }) => {
          const result = await this.#snapsProvider.request({
            method: 'snap_experimentalProviderRequest',
            params: {
              chainId: `eip155:${chainId}`,
              request,
            },
          } as any);

          return result;
        },
      };

      const client = createClient({
        transport: custom(provider),
        chain,
      });

      const signerAddress = await this.#signer.getAddress();
      const signatory = {
        account: await this.#signer.toAccount(),
      };

      smartAccount = await toMetaMaskSmartAccount({
        implementation: Implementation.MultiSig,
        deployParams: [[signerAddress], 1n],
        deploySalt: this.#deploymentSalt,
        signatory: [signatory],
        client,
      });

      this.#metaMaskSmartAccountByChainId[chainId] = smartAccount;
    }

    return smartAccount;
  }

  public async getAccountAddress(options: AccountOptionsBase): Promise<Hex> {
    return await this.#signer.getAddress();
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
