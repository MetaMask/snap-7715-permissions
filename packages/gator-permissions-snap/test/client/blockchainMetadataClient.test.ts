import {
  ChainDisconnectedError,
  InvalidInputError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';
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
    mockEthereumProvider.request.mockReset();
    mockEthereumProvider.request.mockImplementation(() => {
      throw new Error('Unexpected mock call');
    });
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
        // ensureChain is called first (eth_chainId)
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId from ensureChain
          // First attempt: all calls fail with RPC error, then retry internally
          .mockRejectedValueOnce(new Error('RPC error')) // balanceOf (attempt 1)
          .mockRejectedValueOnce(new Error('RPC error')) // decimals (attempt 1)
          .mockRejectedValueOnce(new Error('RPC error')) // symbol (attempt 1)
          // Internal retries (callContract retries once by default)
          .mockResolvedValueOnce(
            '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
          ) // balanceOf (retry)
          .mockResolvedValueOnce(
            '0x0000000000000000000000000000000000000000000000000000000000000012',
          ) // decimals (retry)
          .mockResolvedValueOnce(
            '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
          ); // symbol (retry)

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

        // 1 eth_chainId + 3 failed calls + 3 retry calls = 7 calls
        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(7);
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
        // ensureChain is called first (eth_chainId)
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId from ensureChain
          // First attempt: balanceOf returns null (throws ResourceNotFoundError), decimals and symbol succeed
          .mockResolvedValueOnce(null) // balanceOf (attempt 1 - null throws ResourceNotFoundError)
          .mockResolvedValueOnce(
            '0x0000000000000000000000000000000000000000000000000000000000000012',
          ) // decimals (attempt 1 - succeeds)
          .mockResolvedValueOnce(
            '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
          ) // symbol (attempt 1 - succeeds)
          // Internal retry for balanceOf (callContract retries once by default)
          .mockResolvedValueOnce(
            '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
          ); // balanceOf (retry - succeeds)

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

        // 1 eth_chainId + 3 first attempt calls + 1 retry call = 5 calls
        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(5);
      });
    });
  });

  describe('checkDelegationDisabledOnChain', () => {
    const mockDelegationHash =
      '0x1234567890123456789012345678901234567890123456789012345678901234' as const;
    const mockChainId = '0xaa36a7' as const;
    const mockDelegationManagerAddress =
      '0x1234567890123456789012345678901234567890';

    beforeEach(() => {
      mockEthereumProvider.request.mockClear();
    });

    it('should return true when delegation is disabled on-chain', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      // Result: 0x0000000000000000000000000000000000000000000000000000000000000001 (true)
      mockEthereumProvider.request.mockResolvedValueOnce(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      ); // disabledDelegations call

      const result = await client.checkDelegationDisabledOnChain({
        delegationHash: mockDelegationHash,
        chainId: mockChainId,
        delegationManagerAddress: mockDelegationManagerAddress,
      });

      expect(result).toBe(true);
      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
    });

    it('should return false when delegation is not disabled on-chain', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      // Result: 0x0000000000000000000000000000000000000000000000000000000000000000 (false)
      mockEthereumProvider.request.mockResolvedValueOnce(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ); // disabledDelegations call

      const result = await client.checkDelegationDisabledOnChain({
        delegationHash: mockDelegationHash,
        chainId: mockChainId,
        delegationManagerAddress: mockDelegationManagerAddress,
      });

      expect(result).toBe(false);
      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
    });

    it('should throw InvalidInputError when delegationHash is missing', async () => {
      await expect(
        client.checkDelegationDisabledOnChain({
          delegationHash: '' as any,
          chainId: mockChainId,
          delegationManagerAddress: mockDelegationManagerAddress,
        }),
      ).rejects.toThrow('No delegation hash provided');

      expect(mockEthereumProvider.request).not.toHaveBeenCalled();
    });

    it('should throw InvalidInputError when chainId is missing', async () => {
      await expect(
        client.checkDelegationDisabledOnChain({
          delegationHash: mockDelegationHash,
          chainId: '' as any,
          delegationManagerAddress: mockDelegationManagerAddress,
        }),
      ).rejects.toThrow('No chain ID provided');

      expect(mockEthereumProvider.request).not.toHaveBeenCalled();
    });

    it('should throw InvalidInputError when delegationManagerAddress is missing', async () => {
      await expect(
        client.checkDelegationDisabledOnChain({
          delegationHash: mockDelegationHash,
          chainId: mockChainId,
          delegationManagerAddress: '' as any,
        }),
      ).rejects.toThrow('No delegation manager address provided');

      expect(mockEthereumProvider.request).not.toHaveBeenCalled();
    });

    it('should propagate ChainDisconnectedError from ensureChain', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce('0x1'); // Wrong chain
      mockEthereumProvider.request.mockResolvedValueOnce('OK'); // switch chain
      mockEthereumProvider.request.mockResolvedValueOnce('0x1'); // Still wrong chain

      await expect(
        client.checkDelegationDisabledOnChain({
          delegationHash: mockDelegationHash,
          chainId: mockChainId,
          delegationManagerAddress: mockDelegationManagerAddress,
        }),
      ).rejects.toThrow('Selected chain does not match the requested chain');
    });

    it('should throw ResourceUnavailableError when contract call fails after retries', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      // First attempt fails
      mockEthereumProvider.request.mockRejectedValueOnce(
        new Error('RPC error'),
      ); // eth_call (attempt 1)
      // Retry also fails
      mockEthereumProvider.request.mockRejectedValueOnce(
        new Error('RPC error'),
      ); // eth_call (retry)

      await expect(
        client.checkDelegationDisabledOnChain({
          delegationHash: mockDelegationHash,
          chainId: mockChainId,
          delegationManagerAddress: mockDelegationManagerAddress,
        }),
      ).rejects.toThrow(ResourceUnavailableError);

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(3);
    });

    it('should throw ResourceUnavailableError when contract call returns null', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      // First attempt returns null
      mockEthereumProvider.request.mockResolvedValueOnce(null); // eth_call (attempt 1)
      // Retry also returns null
      mockEthereumProvider.request.mockResolvedValueOnce(null); // eth_call (retry)

      await expect(
        client.checkDelegationDisabledOnChain({
          delegationHash: mockDelegationHash,
          chainId: mockChainId,
          delegationManagerAddress: mockDelegationManagerAddress,
        }),
      ).rejects.toThrow(ResourceUnavailableError);
    });

    it('should use custom retry options', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      // First attempt fails
      mockEthereumProvider.request.mockRejectedValueOnce(
        new Error('RPC error'),
      ); // eth_call (attempt 1)
      // Retry succeeds
      mockEthereumProvider.request.mockResolvedValueOnce(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      ); // eth_call (retry)

      const result = await client.checkDelegationDisabledOnChain({
        delegationHash: mockDelegationHash,
        chainId: mockChainId,
        delegationManagerAddress: mockDelegationManagerAddress,
        retryOptions: {
          retries: 2,
          delayMs: 500,
        },
      });

      expect(result).toBe(true);
      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(3);
    });

    it('should not retry on InvalidInputError from callContract', async () => {
      const invalidInputError = new InvalidInputError('Invalid input');
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      mockEthereumProvider.request.mockRejectedValueOnce(invalidInputError); // eth_call

      await expect(
        client.checkDelegationDisabledOnChain({
          delegationHash: mockDelegationHash,
          chainId: mockChainId,
          delegationManagerAddress: mockDelegationManagerAddress,
        }),
      ).rejects.toThrow('Invalid input');

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
    });

    it('should not retry on ChainDisconnectedError from callContract', async () => {
      const chainDisconnectedError = new ChainDisconnectedError(
        'Chain disconnected',
      );
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      mockEthereumProvider.request.mockRejectedValueOnce(
        chainDisconnectedError,
      ); // eth_call

      await expect(
        client.checkDelegationDisabledOnChain({
          delegationHash: mockDelegationHash,
          chainId: mockChainId,
          delegationManagerAddress: mockDelegationManagerAddress,
        }),
      ).rejects.toThrow('Chain disconnected');

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
    });
  });

  // TODO: Add test cases for checkTransactionReceipt
});
