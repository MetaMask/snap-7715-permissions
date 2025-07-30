import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/delegation-core';

import type { NonceCaveatClient } from '../clients/nonceCaveatClient';

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
   * @param chainId - The chain ID.
   * @param account - The address of the account.
   * @returns A promise resolving to the nonce.
   */
  public async getNonce(chainId: number, account: Hex): Promise<number> {
    logger.debug('NonceCaveatService:getNonce()');

    const nonce = await this.#nonceCaveatClient.getNonce({
      chainId,
      account,
    });

    logger.debug('NonceCaveatService:getNonce() - nonce resolved');

    return nonce;
  }
}
