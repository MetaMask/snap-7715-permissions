import { ChainDisconnectedError, InvalidInputError } from '@metamask/snaps-sdk';
import { numberToHex } from '@metamask/utils';

import { BlockchainTokenMetadataClient } from '../../src/clients/blockchainMetadataClient';

describe('BlockchainTokenMetadataClient', () => {
  const mockEthereumProvider = {
    request: jest.fn(),
  };
  let client = new BlockchainTokenMetadataClient({
    ethereumProvider: mockEthereumProvider,
  });

  beforeEach(() => {
    mockEthereumProvider.request.mockClear();
    client = new BlockchainTokenMetadataClient({
      ethereumProvider: mockEthereumProvider,
    });
  });

  describe('getTokenBalanceAndMetadata', () => {
    const mockAccount = '0x4f10501E98476Bc5c7C322a8ae87226aFC8a66a2';
    const mockTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const mockChainId = 11155111;
    const mockChainIdHex = numberToHex(mockChainId);

    it('fetches native token balance and metadata successfully', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce('0xde0b6b3a7640000'); // eth_getBalance (1 ETH in wei)

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
      });

      expect(result).toStrictEqual({
        balance: BigInt('1000000000000000000'),
        decimals: 18,
        symbol: 'ETH',
      });

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
      expect(mockEthereumProvider.request).toHaveBeenNthCalledWith(1, {
        method: 'eth_chainId',
        params: [],
      });
      expect(mockEthereumProvider.request).toHaveBeenNthCalledWith(2, {
        method: 'eth_getBalance',
        params: [mockAccount, 'latest'],
      });
    });

    it('fetches ERC20 token balance and metadata successfully', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        ) // balanceOf
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000000000000000012',
        ) // decimals
        .mockResolvedValueOnce(
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
        ); // symbol

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
        assetAddress: mockTokenAddress,
      });

      expect(result).toStrictEqual({
        balance: BigInt('1000000000000000000'),
        decimals: 18,
        symbol: 'DAI',
      });

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(4);
      expect(mockEthereumProvider.request).toHaveBeenNthCalledWith(1, {
        method: 'eth_chainId',
        params: [],
      });
    });

    it('throws an error if chainId is not provided', async () => {
      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: 0,
          account: mockAccount,
        }),
      ).rejects.toThrow('No chainId provided to fetch token balance');
      expect(mockEthereumProvider.request).not.toHaveBeenCalled();
    });

    it('throws an error if account is not provided', async () => {
      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: '' as any,
        }),
      ).rejects.toThrow('No account address provided to fetch token balance');
      expect(mockEthereumProvider.request).not.toHaveBeenCalled();
    });

    it('switches chain if selected chain does not match requested chain', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce('0x01') // eth_chainId
        .mockResolvedValueOnce('OK') // switch chain
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        ) // balanceOf
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000000000000000012',
        ) // decimals
        .mockResolvedValueOnce(
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
        ); // symbol

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
      });

      expect(result).toStrictEqual({
        balance: 1000000000000000000n,
        decimals: 18,
        symbol: 'ETH',
      });

      expect(mockEthereumProvider.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: numberToHex(mockChainId) }],
      });
    });

    it('throws an error if native token balance fetch fails', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce(null); // eth_getBalance

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Failed to fetch token balance and metadata');
    });

    it('throws an error if ERC20 token balance fetch fails', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce(null) // balanceOf
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000000000000000012',
        ) // decimals
        .mockResolvedValueOnce(
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
        ); // symbol

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          assetAddress: mockTokenAddress,
        }),
      ).rejects.toThrow('Failed to fetch token balance');
    });

    it('throws an error if ERC20 token decimals fetch fails', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        ) // balanceOf
        .mockResolvedValueOnce(null) // decimals
        .mockResolvedValueOnce(
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
        ); // symbol

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          assetAddress: mockTokenAddress,
        }),
      ).rejects.toThrow('Failed to fetch token balance and metadata');
    });

    it('throws an error if ERC20 token symbol fetch fails', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        ) // balanceOf
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000000000000000012',
        ) // decimals
        .mockResolvedValueOnce(null); // symbol

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          assetAddress: mockTokenAddress,
        }),
      ).rejects.toThrow('Failed to fetch token balance and metadata');
    });

    describe('retry logic', () => {
      it('retries once on RPC error and succeeds for native token', async () => {
        // First call fails with RPC error
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockRejectedValueOnce(new Error('RPC error')); // eth_getBalance

        // Second call succeeds
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockResolvedValueOnce('0xde0b6b3a7640000'); // eth_getBalance (1 ETH in wei)

        const result = await client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        });

        expect(result).toStrictEqual({
          balance: BigInt('1000000000000000000'),
          decimals: 18,
          symbol: 'ETH',
        });

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(4);
      });

      it('retries once on RPC error and succeeds for ERC20 token', async () => {
        // First call fails with RPC error
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockRejectedValueOnce(new Error('RPC error')) // balanceOf
          .mockRejectedValueOnce(new Error('RPC error')) // decimals
          .mockRejectedValueOnce(new Error('RPC error')); // symbol

        // Second call succeeds
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockResolvedValueOnce(
            '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
          ) // balanceOf
          .mockResolvedValueOnce(
            '0x0000000000000000000000000000000000000000000000000000000000000012',
          ) // decimals
          .mockResolvedValueOnce(
            '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
          ); // symbol

        const result = await client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          assetAddress: mockTokenAddress,
        });

        expect(result).toStrictEqual({
          balance: BigInt('1000000000000000000'),
          decimals: 18,
          symbol: 'DAI',
        });

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(8);
      });

      it('retries with custom retry options', async () => {
        // First call fails with RPC error
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockRejectedValueOnce(new Error('RPC error')); // eth_getBalance

        // Second call succeeds
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockResolvedValueOnce('0xde0b6b3a7640000'); // eth_getBalance (1 ETH in wei)

        const result = await client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          retryOptions: {
            retries: 2,
            delayMs: 500,
          },
        });

        expect(result).toStrictEqual({
          balance: BigInt('1000000000000000000'),
          decimals: 18,
          symbol: 'ETH',
        });

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(4);
      });

      it('does not retry on ChainDisconnectedError', async () => {
        // Mock the error to be a ChainDisconnectedError
        const chainDisconnectedError = new ChainDisconnectedError(
          'Chain disconnected',
        );

        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockRejectedValueOnce(chainDisconnectedError); // eth_getBalance

        await expect(
          client.getTokenBalanceAndMetadata({
            chainId: mockChainId,
            account: mockAccount,
          }),
        ).rejects.toThrow('Chain disconnected');

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
      });

      it('does not retry on InvalidInputError', async () => {
        // Mock the error to be an InvalidInputError
        const invalidInputError = new InvalidInputError('Invalid input');

        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockRejectedValueOnce(invalidInputError); // eth_getBalance

        await expect(
          client.getTokenBalanceAndMetadata({
            chainId: mockChainId,
            account: mockAccount,
          }),
        ).rejects.toThrow('Invalid input');

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
      });

      it('retries up to the specified number of attempts', async () => {
        // All calls fail with RPC error
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockRejectedValueOnce(new Error('RPC error')) // eth_getBalance
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockRejectedValueOnce(new Error('RPC error')) // eth_getBalance
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockRejectedValueOnce(new Error('RPC error')) // eth_getBalance
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockRejectedValueOnce(new Error('RPC error')); // eth_getBalance

        await expect(
          client.getTokenBalanceAndMetadata({
            chainId: mockChainId,
            account: mockAccount,
            retryOptions: {
              retries: 3,
              delayMs: 100,
            },
          }),
        ).rejects.toThrow('Failed to fetch token balance and metadata');

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(8); // 4 attempts * 2 calls each
      });

      it('uses default retry options when none provided', async () => {
        // First call fails with RPC error
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockRejectedValueOnce(new Error('RPC error')); // eth_getBalance

        // Second call succeeds
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockResolvedValueOnce('0xde0b6b3a7640000'); // eth_getBalance (1 ETH in wei)

        const result = await client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        });

        expect(result).toStrictEqual({
          balance: BigInt('1000000000000000000'),
          decimals: 18,
          symbol: 'ETH',
        });

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(4);
      });

      it('succeeds on first attempt when no retry is needed', async () => {
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockResolvedValueOnce('0xde0b6b3a7640000'); // eth_getBalance (1 ETH in wei)

        const result = await client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          retryOptions: {
            retries: 2,
            delayMs: 1000,
          },
        });

        expect(result).toStrictEqual({
          balance: BigInt('1000000000000000000'),
          decimals: 18,
          symbol: 'ETH',
        });

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
      });

      it('retries on null response for native token', async () => {
        // First call returns null
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockResolvedValueOnce(null); // eth_getBalance

        // Second call succeeds
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockResolvedValueOnce('0xde0b6b3a7640000'); // eth_getBalance (1 ETH in wei)

        const result = await client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        });

        expect(result).toStrictEqual({
          balance: BigInt('1000000000000000000'),
          decimals: 18,
          symbol: 'ETH',
        });

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(4);
      });

      it('retries on null response for ERC20 token', async () => {
        // First call returns null for balance
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockResolvedValueOnce(null) // balanceOf
          .mockResolvedValueOnce(
            '0x0000000000000000000000000000000000000000000000000000000000000012',
          ) // decimals
          .mockResolvedValueOnce(
            '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
          ); // symbol

        // Second call succeeds
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
          .mockResolvedValueOnce(
            '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
          ) // balanceOf
          .mockResolvedValueOnce(
            '0x0000000000000000000000000000000000000000000000000000000000000012',
          ) // decimals
          .mockResolvedValueOnce(
            '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
          ); // symbol

        const result = await client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          assetAddress: mockTokenAddress,
        });

        expect(result).toStrictEqual({
          balance: BigInt('1000000000000000000'),
          decimals: 18,
          symbol: 'DAI',
        });

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(8);
      });
    });
  });
});
