import { logger } from '@metamask/7715-permissions-shared/utils';
import { decodeSingle } from '@metamask/abi-utils';
import type { Hex } from '@metamask/delegation-core';
import { ChainDisconnectedError, InvalidInputError, ResourceNotFoundError, type SnapsEthereumProvider } from '@metamask/snaps-sdk';
import { hexToNumber, numberToHex } from '@metamask/utils';

import { ZERO_ADDRESS } from '../constants';
import type { TokenBalanceAndMetadata, TokenMetadataClient } from './types';

/**
 * Client that fetches token metadata directly from the blockchain using the ethereum provider
 */
export class BlockchainTokenMetadataClient implements TokenMetadataClient {
  readonly #ethereumProvider: SnapsEthereumProvider;

  static readonly #nativeTokenAddress = ZERO_ADDRESS;

  static readonly #nativeTokenDecimals = 18;

  static readonly #nativeTokenSymbol = 'ETH';

  // keccak256('balanceOf(address)')
  static readonly #balanceOfCalldata = '0x70a08231';

  // keccak256('decimals()')
  static readonly #decimalsCalldata = '0x313ce567';

  // keccak256('symbol()')
  static readonly #symbolCalldata = '0x95d89b41';

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
   * @param args.assetAddress - The token address to fetch the balance for. If not provided, fetches native token balance.
   * @param args.account - The account address to fetch the balance for.
   * @returns The token balance and metadata.
   */
  public async getTokenBalanceAndMetadata({
    chainId,
    assetAddress,
    account,
  }: {
    chainId: number;
    account: Hex;
    assetAddress?: Hex | undefined;
  }): Promise<TokenBalanceAndMetadata> {
    logger.debug('BlockchainTokenMetadataClient:getTokenBalanceAndMetadata()');

    if (!chainId) {
      const message = 'No chainId provided to fetch token balance';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    if (!account) {
      const message = 'No account address provided to fetch token balance';
      logger.error(message);
      throw new InvalidInputError(message);
    }

    // Check if we're on the correct chain
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
        throw new ChainDisconnectedError('Selected chain does not match the requested chain');
      }
    }

    // If no asset address is provided, fetch native token balance
    if (
      !assetAddress ||
      assetAddress === BlockchainTokenMetadataClient.#nativeTokenAddress
    ) {
      const balance = await this.#ethereumProvider.request<Hex>({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      });

      if (balance === undefined || balance === null) {
        throw new ResourceNotFoundError('Failed to fetch native token balance');
      }

      const { symbol, decimals } = {
        symbol: BlockchainTokenMetadataClient.#nativeTokenSymbol,
        decimals: BlockchainTokenMetadataClient.#nativeTokenDecimals,
      };

      return {
        balance: BigInt(balance),
        decimals,
        symbol,
      };
    }

    let balanceEncoded;
    let decimalsEncoded;
    let symbolEncoded;

    try {
      [balanceEncoded, decimalsEncoded, symbolEncoded] = await Promise.all([
        this.#ethereumProvider.request<Hex>({
          method: 'eth_call',
          params: [
            {
              to: assetAddress,
              data:
                BlockchainTokenMetadataClient.#balanceOfCalldata +
                account.slice(2).padStart(64, '0'),
            },
            'latest',
          ],
        }),
        this.#ethereumProvider.request<Hex>({
          method: 'eth_call',
          params: [
            {
              to: assetAddress,
              data: BlockchainTokenMetadataClient.#decimalsCalldata,
            },
            'latest',
          ],
        }),
        this.#ethereumProvider.request<Hex>({
          method: 'eth_call',
          params: [
            {
              to: assetAddress,
              data: BlockchainTokenMetadataClient.#symbolCalldata,
            },
            'latest',
          ],
        }),
      ]);
    } catch (error) {
      logger.error('Failed to fetch token balance and metadata', error);
      throw new ResourceNotFoundError('Failed to fetch token balance and metadata');
    }

    if (!symbolEncoded) {
      logger.error('Failed to fetch token symbol');
      throw new ResourceNotFoundError('Failed to fetch token symbol');
    }

    if (!decimalsEncoded) {
      logger.error('Failed to fetch token decimals');
      throw new ResourceNotFoundError('Failed to fetch token decimals');
    }

    if (!balanceEncoded) {
      logger.error('Failed to fetch token balance');
      throw new ResourceNotFoundError('Failed to fetch token balance');
    }

    if (
      symbolEncoded === '0x' &&
      decimalsEncoded === '0x' &&
      balanceEncoded === '0x'
    ) {
      throw new InvalidInputError(
        'Failed to fetch token balance and metadata: Token address is invalid',
      );
    }

    try {
      const symbol = decodeSingle('string', symbolEncoded);
      const decimals = decodeSingle('uint8', decimalsEncoded);
      const balance = decodeSingle('uint256', balanceEncoded);

      return {
        balance,
        decimals: Number(decimals),
        symbol,
      };
    } catch (error) {
      logger.error(
        `Failed to fetch token balance and metadata: ${(error as Error).message}.`,
      );

      throw new ResourceNotFoundError(`Failed to fetch token balance and metadata`);
    }
  }
}
