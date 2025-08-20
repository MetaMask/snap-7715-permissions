import { logger } from '@metamask/7715-permissions-shared/utils';
import { decodeSingle } from '@metamask/abi-utils';
import type { Hex } from '@metamask/delegation-core';
import {
  ChainDisconnectedError,
  InvalidInputError,
  ResourceUnavailableError,
  type SnapsEthereumProvider,
} from '@metamask/snaps-sdk';
import { hexToNumber, numberToHex } from '@metamask/utils';

import { getChainMetadata } from '../core/chainMetadata';

/**
 * Client that fetches nonce from nonce caveat enforcer.
 */
export class NonceCaveatClient {
  readonly #ethereumProvider: SnapsEthereumProvider;

  // keccak256('currentNonce()')
  static readonly #currentNonceCalldata = '0x2bd4ed21';

  constructor({
    ethereumProvider,
  }: {
    ethereumProvider: SnapsEthereumProvider;
  }) {
    this.#ethereumProvider = ethereumProvider;
  }

  /**
   * Fetch the token balance and metadata for a given account and token.
   * @param args - The parameters for fetching the token balance.
   * @param args.chainId - The chain ID to fetch the balance from.
   * @param args.account - The account address to fetch the nonce for.
   * @returns The nonce.
   */
  public async getNonce({
    chainId,
    account,
  }: {
    chainId: number;
    account: Hex;
  }): Promise<bigint> {
    logger.debug('BlockchainTokenMetadataClient:getTokenBalanceAndMetadata()');

    if (!chainId) {
      const message = 'No chainId provided to fetch nonce';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    const { contracts } = getChainMetadata({ chainId });

    if (!account) {
      const message = 'No account address provided to fetch nonce';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    // Check if we're on the correct chain and switch if not
    const selectedChain = await this.#ethereumProvider.request<Hex>({
      method: 'eth_chainId',
      params: [],
    });

    if (selectedChain && hexToNumber(selectedChain) !== chainId) {
      await this.#ethereumProvider.request<Hex>({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: numberToHex(chainId) }],
      });

      const updatedChain = await this.#ethereumProvider.request<Hex>({
        method: 'eth_chainId',
        params: [],
      });

      if (updatedChain && hexToNumber(updatedChain) !== chainId) {
        throw new ChainDisconnectedError(
          'Selected chain does not match the requested chain',
        );
      }
    }

    let nonceEncoded;
    try {
      nonceEncoded = await this.#ethereumProvider.request<Hex>({
        method: 'eth_call',
        params: [
          {
            to: contracts.enforcers.NonceEnforcer,
            data:
              NonceCaveatClient.#currentNonceCalldata +
              contracts.delegationManager.slice(2).padStart(64, '0') +
              account.slice(2).padStart(64, '0'),
          },
          'latest',
        ],
      });
    } catch (error) {
      logger.error(`Failed to fetch nonce: ${(error as Error).message}.`);
      throw new ResourceUnavailableError('Failed to fetch nonce');
    }

    if (!nonceEncoded) {
      logger.error('Failed to fetch nonce');
      throw new ResourceUnavailableError('Failed to fetch nonce');
    }

    try {
      const nonce = decodeSingle('uint256', nonceEncoded);
      return nonce;
    } catch (error) {
      logger.error(`Failed to fetch nonce: ${(error as Error).message}.`);

      throw new ResourceUnavailableError('Failed to fetch nonce');
    }
  }
}
