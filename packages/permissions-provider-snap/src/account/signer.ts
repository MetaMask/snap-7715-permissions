import SimpleKeyring from '@metamask/eth-simple-keyring';
import { toAccount } from 'viem/accounts';
import type { Account, CustomSource, Hex } from 'viem';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { Logger } from 'src/logger';

const GET_ENTROPY_SALT = '7715_permissions_provider_snap';

type SignTypedDataFunction = CustomSource['signTypedData'];

/**
 * Represents a Signer of a Multisig DeleGator Account, derives the private key from snaps entropy.
 */
export class Signer {
  #signerKeyring: Promise<SimpleKeyring> | undefined;
  #snapsProvider: SnapsProvider;
  #logger: Logger;

  /**
   * Creates a new Signer instance.
   * @param config - Configuration object
   * @param config.snapsProvider - Provider for interacting with snaps environment
   * @param config.logger - Logger instance
   */
  constructor(config: { snapsProvider: SnapsProvider; logger: Logger }) {
    this.#snapsProvider = config.snapsProvider;
    this.#logger = config.logger;
  }

  /**
   * Gets the Ethereum address associated with this signer.
   * @returns Promise resolving to the hex address
   * @throws Error if there is not exactly one account
   */
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

  /**
   * Converts the signer to a viem Account object.
   * @returns Promise resolving to a viem Account
   */
  public async toAccount(): Promise<Account> {
    this.#logger.debug('signer:toAccount()');
    const address = await this.getAddress();

    const unsupportedSignMethod = (method: string) => () => {
      throw new Error(`Unsupported sign method: ${method}`);
    };

    const keyring = await this.#getOrCreateSignerKeyring();
    this.#logger.debug('signer:toAccount() - created keyring');

    const signTypedData = this.#createSignTypedDataAdapter(address, keyring);

    this.#logger.debug('signer:toAccount() - created signTypedDataAdapter');

    const account = toAccount({
      address,
      signMessage: unsupportedSignMethod('signMessage'),
      signTransaction: unsupportedSignMethod('signTransaction'),
      signTypedData,
    });

    this.#logger.debug('signer:toAccount() - account created');

    return account;
  }

  /**
   * Gets an existing keyring or creates a new one if none exists.
   * @returns Promise resolving to a SimpleKeyring instance
   * @private
   */
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

  /**
   * Creates a function to sign typed data using the keyring.
   * @param address - The address to sign with
   * @param keyring - The keyring to use for signing
   * @returns Function that signs typed data
   * @private
   */
  #createSignTypedDataAdapter(
    address: Hex,
    keyring: SimpleKeyring,
  ): SignTypedDataFunction {
    // todo we should do better at aligning the types
    // @ts-expect-error SignTypedDataFunction is a complex generic type that is derived from parameters in viem
    return async (message: Parameters<SignTypedDataFunction>[0]) => {
      this.#logger.debug(
        'signer:createSignTypedDataAdapter() - signing typed data',
        message,
      );

      const signature = await keyring.signTypedData(address, message, {
        version: 'V4',
      });

      this.#logger.debug(
        'signer:createSignTypedDataAdapter() - signature created',
        signature,
      );
      return signature as Hex;
    };
  }
}
