import { logger } from '@metamask/7715-permissions-shared/utils';
import type { SnapsEthereumProvider } from '@metamask/snaps-sdk';
import type { Abi, AbiFunction, AbiParameter, Address, Chain, Hex } from 'viem';
import {
  decodeAbiParameters,
  encodeFunctionData,
  extractChain,
  zeroAddress,
} from 'viem';
import * as allChains from 'viem/chains';

import type { TokenBalanceAndMetadata, TokenMetadataClient } from './types';

const BALANCEOF_ABI: AbiFunction = {
  constant: true,
  inputs: [{ name: '_owner', type: 'address' }],
  name: 'balanceOf',
  outputs: [{ name: 'balance', type: 'uint256' }],
  type: 'function',
  stateMutability: 'view',
};

const DECIMALS_ABI: AbiFunction = {
  constant: true,
  inputs: [],
  name: 'decimals',
  outputs: [{ name: '', type: 'uint8' }],
  type: 'function',
  stateMutability: 'view',
};

const SYMBOL_ABI: AbiFunction = {
  constant: true,
  inputs: [],
  name: 'symbol',
  outputs: [{ name: '', type: 'string' }],
  type: 'function',
  stateMutability: 'view',
};

const ERC20_ABI: Abi = [BALANCEOF_ABI, DECIMALS_ABI, SYMBOL_ABI];

/**
 * Client that fetches token metadata directly from the blockchain using the ethereum provider
 */
export class BlockchainTokenMetadataClient implements TokenMetadataClient {
  readonly #ethereumProvider: SnapsEthereumProvider;

  static #allChains = Object.keys(allChains).map(
    (name) => (allChains as any)[name as keyof typeof allChains],
  ) as Chain[];

  constructor({
    ethereumProvider,
  }: {
    ethereumProvider: SnapsEthereumProvider;
  }) {
    this.#ethereumProvider = ethereumProvider;
  }

  /**
   * Fetch the token balance and metadata for a given account and token.
   *
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
    account: Address;
    assetAddress?: Address | undefined;
  }): Promise<TokenBalanceAndMetadata> {
    logger.debug('BlockchainTokenMetadataClient:getTokenBalanceAndMetadata()');

    if (!chainId) {
      const message = 'No chainId provided to fetch token balance';
      logger.error(message);
      throw new Error(message);
    }

    if (!account) {
      const message = 'No account address provided to fetch token balance';
      logger.error(message);
      throw new Error(message);
    }

    // Check if we're on the correct chain
    const selectedChain = await this.#ethereumProvider.request({
      method: 'eth_chainId',
      params: [],
    });

    if (Number(selectedChain) !== chainId) {
      throw new Error('Selected chain does not match the requested chain');
    }

    // If no asset address is provided, fetch native token balance
    if (!assetAddress || assetAddress === zeroAddress) {
      const balance = await this.#ethereumProvider.request<Hex>({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      });

      // @ts-expect-error - extractChain does not work well with dynamic `chains`
      const chain = extractChain({
        chains: BlockchainTokenMetadataClient.#allChains,
        id: chainId,
      });

      const { symbol, decimals } = chain.nativeCurrency;

      if (balance === undefined || balance === null) {
        throw new Error('Failed to fetch native token balance');
      }

      return {
        balance: BigInt(balance),
        decimals,
        symbol,
      };
    }

    // todo: it is not clear why these are failing in test, but we will be
    // removing viem as a dependency, so there is not much point in investigating
    // the root cause.

    // @ts-expect-error - encodeFunctionData fails tests with Expected 0 arguments, but got 1
    const balanceOfCalldata = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account],
    });

    // @ts-expect-error - encodeFunctionData fails tests with Expected 0 arguments, but got 1
    const decimalsCalldata = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    // @ts-expect-error - encodeFunctionData fails tests with Expected 0 arguments, but got 1
    const symbolCalldata = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'symbol',
    });

    const [balanceEncoded, decimalsEncoded, symbolEncoded] = await Promise.all([
      this.#ethereumProvider.request<Hex>({
        method: 'eth_call',
        params: [
          {
            to: assetAddress,
            data: balanceOfCalldata,
          },
          'latest',
        ],
      }),
      this.#ethereumProvider.request<Hex>({
        method: 'eth_call',
        params: [
          {
            to: assetAddress,
            data: decimalsCalldata,
          },
          'latest',
        ],
      }),
      this.#ethereumProvider.request<Hex>({
        method: 'eth_call',
        params: [
          {
            to: assetAddress,
            data: symbolCalldata,
          },
          'latest',
        ],
      }),
    ]);

    const decodeOutput = <TReturn>({
      name,
      output: outputs,
      encoded,
    }: {
      output: readonly AbiParameter[];
      encoded: Hex | null | undefined;
      name: string;
    }): TReturn => {
      if (encoded === null || encoded === undefined) {
        throw new Error(`Failed to fetch ${name}`);
      }

      // @ts-expect-error - decodeAbiParameters does not work well
      const [decoded] = decodeAbiParameters(outputs, encoded) as [TReturn];

      return decoded;
    };

    try {
      const symbol = decodeOutput<string>({
        output: SYMBOL_ABI.outputs,
        encoded: symbolEncoded,
        name: 'symbol',
      });

      const decimals = decodeOutput<number>({
        output: DECIMALS_ABI.outputs,
        encoded: decimalsEncoded,
        name: 'decimals',
      });

      const balance = decodeOutput<bigint>({
        output: BALANCEOF_ABI.outputs,
        encoded: balanceEncoded,
        name: 'balance',
      });

      return {
        balance,
        decimals,
        symbol,
      };
    } catch (error) {
      logger.error(
        `Failed to fetch token balance and metadata: ${(error as Error).message}.`,
      );

      throw error;
    }
  }
}
