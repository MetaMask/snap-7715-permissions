import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/delegation-core';

import type { NonceCaveatClient } from '../clients/nonceCaveatClient';

export type GetNonceOptions = {
  chainId: number;
  account: Hex;
};

/**
 * Service responsible for providing the nonce of caveat enforcer for a given account.
 */
export class NonceCaveatService {
  readonly #nonceCaveatClient: NonceCaveatClient;

  /**
   * Initializes a new NonceCaveatService instance.
   * @param config - The configuration object.
   * @param config.nonceCaveatClient - The client for interacting with the nonce caveat enforcer.
   */
  constructor({ nonceCaveatClient }: { nonceCaveatClient: NonceCaveatClient }) {
    this.#nonceCaveatClient = nonceCaveatClient;
  }

  /**
   * Retrieves the nonce of caveat enforcer for the specified account.
   * @param options - The options for fetching the nonce.
   * @param options.chainId - The chain ID.
   * @param options.account - The address of the account.
   * @returns A promise resolving to the nonce.
   */
  public async getNonce(options: GetNonceOptions): Promise<bigint> {
    logger.debug('NonceCaveatService:getNonce()');

    const nonce = await this.#nonceCaveatClient.getNonce(options);

    logger.debug('NonceCaveatService:getNonce() - nonce resolved');

    return nonce;
  }
}
