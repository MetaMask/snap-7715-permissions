import HdKeyring from '@metamask/eth-hd-keyring';
import { Account, Hex } from 'viem';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import { toAccount } from 'viem/accounts';

export class Signer {
  #signerKeyring: HdKeyring | undefined;
  #snapsProvider: SnapsProvider;

  constructor(config: { snapsProvider: SnapsProvider }) {
    this.#snapsProvider = config.snapsProvider;
  }

  public async getAddress(): Promise<Hex> {
    const keyring = await this.#getOrCreateSignerKeyring();
    const accounts = keyring.getAccounts();

    if (accounts.length !== 1) {
      throw new Error('Expected exactly one account');
    }

    return accounts[0]!;
  }

  public async toAccount(): Promise<Account> {
    const address = await this.getAddress();

    const unsupportedSignMethod = (method: string) => () => {
      throw new Error(`Unsupported sign method: ${method}`);
    };

    return toAccount({
      address,
      signMessage: unsupportedSignMethod('signMessage'),
      signTransaction: unsupportedSignMethod('signTransaction'),
      // todo: implement signTypedData
      signTypedData: unsupportedSignMethod('signTypedData'),
    });
  }

  async #getOrCreateSignerKeyring() {
    if (this.#signerKeyring) {
      return this.#signerKeyring;
    }

    const entropy = await this.#snapsProvider.request({
      method: 'snap_getEntropy',
      params: { version: 1 },
    });

    this.#signerKeyring = new HdKeyring();

    await this.#signerKeyring.deserialize({
      mnemonic: entropy,
      numberOfAccounts: 1,
    });

    return this.#signerKeyring;
  }
}
