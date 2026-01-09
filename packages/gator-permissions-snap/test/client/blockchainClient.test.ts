import {
  ChainDisconnectedError,
  InvalidInputError,
  ResourceUnavailableError,
} from '@metamask/snaps-sdk';

import { BlockchainClient } from '../../src/clients/blockchainClient';
import type { TransactionReceipt } from '../../src/clients/types';

describe('BlockchainClient', () => {
  const mockEthereumProvider = {
    request: jest.fn(),
  };
  let client = new BlockchainClient({
    ethereumProvider: mockEthereumProvider,
  });

  beforeEach(() => {
    mockEthereumProvider.request.mockClear();
    mockEthereumProvider.request.mockReset();
    mockEthereumProvider.request.mockImplementation(() => {
      throw new Error('Unexpected mock call');
    });
    client = new BlockchainClient({
      ethereumProvider: mockEthereumProvider,
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

  describe('checkTransactionReceipt', () => {
    const mockTxHash =
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as const;
    const mockChainId = '0xaa36a7' as const;
    const mockTransactionReceipt: TransactionReceipt = {
      blockHash:
        '0x1234567890123456789012345678901234567890123456789012345678901234',
      blockNumber: '0x0',
      contractAddress: '0x1234567890123456789012345678901234567890',
      cumulativeGasUsed: '0x1',
      effectiveGasPrice: '0x1',
      from: '0x1234567890123456789012345678901234567895',
      gasUsed:
        '0x1234567890123456789012345678901234567890123456789012345678901234',
      status: '0x1',
      transactionHash: mockTxHash,
      transactionIndex:
        '0x1234567890123456789012345678901234567890123456789012345678901234',
      type: '0x2',
      logs: [],
      logsBloom:
        '0x1234567890123456789012345678901234567890123456789012345678901234',
      to: '0x1234567890123456789012345678901234567892',
    };

    beforeEach(() => {
      mockEthereumProvider.request.mockClear();
    });

    it('should return true when transaction receipt status is 0x1 (success)', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      mockEthereumProvider.request.mockResolvedValueOnce(
        mockTransactionReceipt,
      ); // eth_getTransactionReceipt

      const result = await client.checkTransactionReceipt({
        txHash: mockTxHash,
        chainId: mockChainId,
      });

      expect(result).toBe(true);
      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
      expect(mockEthereumProvider.request).toHaveBeenNthCalledWith(1, {
        method: 'eth_chainId',
        params: [],
      });
      expect(mockEthereumProvider.request).toHaveBeenNthCalledWith(2, {
        method: 'eth_getTransactionReceipt',
        params: [mockTxHash],
      });
    });

    it('should return false when transaction receipt status is 0x0 (failure)', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      mockEthereumProvider.request.mockResolvedValueOnce({
        ...mockTransactionReceipt,
        status: '0x0',
      }); // eth_getTransactionReceipt

      const result = await client.checkTransactionReceipt({
        txHash: mockTxHash,
        chainId: mockChainId,
      });

      expect(result).toBe(false);
      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
    });

    it('should throw ResourceNotFoundError when transaction receipt is not found', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      mockEthereumProvider.request.mockResolvedValueOnce(null); // eth_getTransactionReceipt

      await expect(
        client.checkTransactionReceipt({
          txHash: mockTxHash,
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Transaction receipt not found');
    });

    it('should throw InvalidInputError when chainId is missing', async () => {
      await expect(
        client.checkTransactionReceipt({
          txHash: mockTxHash,
          chainId: '' as any,
        }),
      ).rejects.toThrow('No chain ID provided');

      expect(mockEthereumProvider.request).not.toHaveBeenCalled();
    });

    it('should throw InvalidInputError when transaction receipt schema is invalid', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      mockEthereumProvider.request.mockResolvedValueOnce({
        extraField: 'extraField',
      }); // eth_getTransactionReceipt
      await expect(
        client.checkTransactionReceipt({
          txHash: mockTxHash,
          chainId: mockChainId,
        }),
      ).rejects.toThrow(
        'Failed type validation: blockHash: Required, blockNumber: Required, contractAddress: Required, cumulativeGasUsed: Required, effectiveGasPrice: Required, from: Required, gasUsed: Required, logs: Required, logsBloom: Required, status: Required, to: Required, transactionHash: Required, transactionIndex: Required, type: Required',
      );
    });

    it('should propagate ChainDisconnectedError from ensureChain', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce('0x1'); // Wrong chain
      mockEthereumProvider.request.mockResolvedValueOnce('OK'); // switch chain
      mockEthereumProvider.request.mockResolvedValueOnce('0x1'); // Still wrong chain

      await expect(
        client.checkTransactionReceipt({
          txHash: mockTxHash,
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Selected chain does not match the requested chain');
    });

    it('should switch chain if selected chain does not match requested chain', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce('0x1'); // Wrong chain
      mockEthereumProvider.request.mockResolvedValueOnce('OK'); // switch chain
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // Correct chain after switch
      mockEthereumProvider.request.mockResolvedValueOnce(
        mockTransactionReceipt,
      ); // eth_getTransactionReceipt

      const result = await client.checkTransactionReceipt({
        txHash: mockTxHash,
        chainId: mockChainId,
      });

      expect(result).toBe(true);
      expect(mockEthereumProvider.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: mockChainId }],
      });
    });

    it('should throw ResourceUnavailableError when getTransactionReceipt fails after retries', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      // First attempt fails
      mockEthereumProvider.request.mockRejectedValueOnce(
        new Error('RPC error'),
      ); // eth_getTransactionReceipt (attempt 1)
      // Retry also fails
      mockEthereumProvider.request.mockRejectedValueOnce(
        new Error('RPC error'),
      ); // eth_getTransactionReceipt (retry)

      await expect(
        client.checkTransactionReceipt({
          txHash: mockTxHash,
          chainId: mockChainId,
        }),
      ).rejects.toThrow(ResourceUnavailableError);

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(3);
    });

    it('should throw ResourceUnavailableError when transaction receipt is not found', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      // First attempt returns null
      mockEthereumProvider.request.mockResolvedValueOnce(null); // eth_getTransactionReceipt (attempt 1)
      // Retry also returns null
      mockEthereumProvider.request.mockResolvedValueOnce(null); // eth_getTransactionReceipt (retry)

      await expect(
        client.checkTransactionReceipt({
          txHash: mockTxHash,
          chainId: mockChainId,
        }),
      ).rejects.toThrow(ResourceUnavailableError);
    });

    it('should not retry on InvalidInputError', async () => {
      const invalidInputError = new InvalidInputError('Invalid input');
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      mockEthereumProvider.request.mockRejectedValueOnce(invalidInputError); // eth_getTransactionReceipt

      await expect(
        client.checkTransactionReceipt({
          txHash: mockTxHash,
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Invalid input');

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
    });

    it('should not retry on ChainDisconnectedError from getTransactionReceipt', async () => {
      const chainDisconnectedError = new ChainDisconnectedError(
        'Chain disconnected',
      );
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      mockEthereumProvider.request.mockRejectedValueOnce(
        chainDisconnectedError,
      ); // eth_getTransactionReceipt

      await expect(
        client.checkTransactionReceipt({
          txHash: mockTxHash,
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Chain disconnected');

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
    });

    it('should retry on RPC error and succeed', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // eth_chainId from ensureChain
      // First attempt fails
      mockEthereumProvider.request.mockRejectedValueOnce(
        new Error('RPC error'),
      ); // eth_getTransactionReceipt (attempt 1)
      // Retry succeeds
      mockEthereumProvider.request.mockResolvedValueOnce(
        mockTransactionReceipt,
      ); // eth_getTransactionReceipt (retry)

      const result = await client.checkTransactionReceipt({
        txHash: mockTxHash,
        chainId: mockChainId,
      });

      expect(result).toBe(true);
      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(3);
    });
  });
});
