import SimpleKeyring from '@metamask/eth-simple-keyring';
import { Account, Hex } from 'viem';
import { toAccount } from 'viem/accounts';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import { Logger } from 'src/logger';

const GET_ENTROPY_SALT = '7715_permissions_provider_snap';

export class Signer {
  #signerKeyring: Promise<SimpleKeyring> | undefined;
  #snapsProvider: SnapsProvider;
  #logger: Logger;

  constructor(config: { snapsProvider: SnapsProvider; logger: Logger }) {
    this.#snapsProvider = config.snapsProvider;
    this.#logger = config.logger;
  }

  public async getAddress(): Promise<Hex> {
    this.#logger.debug('signer:getAddress()');

    const keyring = await this.#getOrCreateSignerKeyring();
    this.#logger.debug('signer:getAddress() - keyring resolved');

    const accounts = await keyring.getAccounts();
    this.#logger.debug('signer:getAddress() - accounts resolved');

    if (accounts.length !== 1) {
      this.#logger.error(
        'signer:getAddress() - expected exactly one account, got ' +
          accounts.length,
      );
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
      signTypedData: () => Promise.resolve('0x1234'),
    });
  }

  async #getOrCreateSignerKeyring() {
    this.#logger.debug('signer:getOrCreateSignerKeyring()');

    if (this.#signerKeyring) {
      return await this.#signerKeyring;
    }
    this.#logger.debug(
      'signer:getOrCreateSignerKeyring() - keyring not resolved',
    );

    this.#signerKeyring = (async () => {
      const entropy = await this.#snapsProvider.request({
        method: 'snap_getEntropy',
        params: { version: 1, salt: GET_ENTROPY_SALT },
      });

      this.#logger.debug('entropy received', entropy);

      const keyring = new SimpleKeyring([entropy]);
      this.#logger.debug('signer:getOrCreateSignerKeyring() - keyring created');

      return keyring;
    })();

    return await this.#signerKeyring;
  }
}
