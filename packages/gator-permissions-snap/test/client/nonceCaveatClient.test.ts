import { ChainDisconnectedError } from '@metamask/snaps-sdk';
import { numberToHex } from '@metamask/utils';

import { NonceCaveatClient } from '../../src/clients/nonceCaveatClient';

describe('NonceCaveatClient', () => {
  const mockEthereumProvider = {
    request: jest.fn(),
  };
  let client = new NonceCaveatClient({
    ethereumProvider: mockEthereumProvider,
  });

  beforeEach(() => {
    mockEthereumProvider.request.mockClear();
    client = new NonceCaveatClient({
      ethereumProvider: mockEthereumProvider,
    });
  });

  describe('getNonce', () => {
    const mockAccount = '0x4f10501E98476Bc5c7C322a8ae87226aFC8a66a2';
    const mockChainId = 11155111;
    const mockChainIdHex = numberToHex(mockChainId);
    const mockDelegationManager = '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3';
    const mockNonceEnforcer = '0xDE4f2FAC4B3D87A1d9953Ca5FC09FCa7F366254f';

    it('fetches nonce successfully', async () => {
      const mockNonceEncoded =
        '0x0000000000000000000000000000000000000000000000000000000000000005';

      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce(mockNonceEncoded); // eth_call

      const result = await client.getNonce({
        chainId: mockChainId,
        account: mockAccount,
      });

      expect(result).toBe(5n);

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
      expect(mockEthereumProvider.request).toHaveBeenNthCalledWith(1, {
        method: 'eth_chainId',
        params: [],
      });
      expect(mockEthereumProvider.request).toHaveBeenNthCalledWith(2, {
        method: 'eth_call',
        params: [
          {
            to: mockNonceEnforcer,
            data: `0x2bd4ed21${mockDelegationManager
              .slice(2)
              .padStart(64, '0')}${mockAccount.slice(2).padStart(64, '0')}`,
          },
          'latest',
        ],
      });
    });

    it('throws an error if chainId is not provided', async () => {
      await expect(
        client.getNonce({
          chainId: 0,
          account: mockAccount,
        }),
      ).rejects.toThrow('No chainId provided to fetch nonce');
      expect(mockEthereumProvider.request).not.toHaveBeenCalled();
    });

    it('throws an error if account is not provided', async () => {
      await expect(
        client.getNonce({
          chainId: mockChainId,
          account: '' as any,
        }),
      ).rejects.toThrow('No account address provided to fetch nonce');
      expect(mockEthereumProvider.request).not.toHaveBeenCalled();
    });

    it('throws an error if nonce fetch fails', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockRejectedValueOnce(new Error('RPC error')); // eth_call

      await expect(
        client.getNonce({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Failed to fetch nonce');
    });

    it('throws an error if nonce response is null', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce(null); // eth_call

      await expect(
        client.getNonce({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Failed to fetch nonce');
    });

    it('throws an error if nonce decoding fails', async () => {
      const invalidNonceEncoded = '0xinvalid';

      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce(invalidNonceEncoded); // eth_call

      await expect(
        client.getNonce({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Failed to fetch nonce');
    });

    it('handles large nonce values correctly', async () => {
      const largeNonceEncoded =
        '0x000000000000000000000000000000000000000000000000000000000000ffff';

      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce(largeNonceEncoded); // eth_call

      const result = await client.getNonce({
        chainId: mockChainId,
        account: mockAccount,
      });

      expect(result).toBe(65535n);
    });

    it('handles zero nonce correctly', async () => {
      const zeroNonceEncoded =
        '0x0000000000000000000000000000000000000000000000000000000000000000';

      mockEthereumProvider.request
        .mockResolvedValueOnce(mockChainIdHex) // eth_chainId
        .mockResolvedValueOnce(zeroNonceEncoded); // eth_call

      const result = await client.getNonce({
        chainId: mockChainId,
        account: mockAccount,
      });

      expect(result).toBe(0n);
    });

    describe('retry logic', () => {
      it('retries once on RPC error and succeeds', async () => {
        const mockNonceEncoded =
          '0x0000000000000000000000000000000000000000000000000000000000000005';

        // ensureChain is called first (eth_chainId)
        mockEthereumProvider.request.mockResolvedValueOnce(mockChainIdHex); // eth_chainId from ensureChain

        // First eth_call fails, second succeeds (retry handled by callContract)
        mockEthereumProvider.request
          .mockRejectedValueOnce(new Error('RPC error')) // eth_call (first attempt)
          .mockResolvedValueOnce(mockNonceEncoded); // eth_call (retry)

        const result = await client.getNonce({
          chainId: mockChainId,
          account: mockAccount,
        });

        expect(result).toBe(5n);
        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(3);
      });

      it('retries with custom retry options', async () => {
        const mockNonceEncoded =
          '0x0000000000000000000000000000000000000000000000000000000000000005';

        // ensureChain is called first (eth_chainId)
        mockEthereumProvider.request.mockResolvedValueOnce(mockChainIdHex); // eth_chainId from ensureChain

        // First eth_call fails, second succeeds (retry handled by callContract)
        mockEthereumProvider.request
          .mockRejectedValueOnce(new Error('RPC error')) // eth_call (first attempt)
          .mockResolvedValueOnce(mockNonceEncoded); // eth_call (retry)

        const result = await client.getNonce({
          chainId: mockChainId,
          account: mockAccount,
          retryOptions: {
            retries: 2,
            delayMs: 500,
          },
        });

        expect(result).toBe(5n);
        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(3);
      });

      it('does not retry on ChainDisconnectedError', async () => {
        // Mock the error to be a ChainDisconnectedError
        const chainDisconnectedError = new ChainDisconnectedError(
          'Chain disconnected',
        );

        // ensureChain is called first (eth_chainId)
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId from ensureChain
          .mockRejectedValueOnce(chainDisconnectedError); // eth_call

        await expect(
          client.getNonce({
            chainId: mockChainId,
            account: mockAccount,
          }),
        ).rejects.toThrow('Chain disconnected');

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
      });

      it('retries up to the specified number of attempts', async () => {
        // ensureChain is called first (eth_chainId)
        mockEthereumProvider.request.mockResolvedValueOnce(mockChainIdHex); // eth_chainId from ensureChain

        // All eth_call attempts fail (retries handled by callContract)
        mockEthereumProvider.request
          .mockRejectedValueOnce(new Error('RPC error')) // eth_call (attempt 1)
          .mockRejectedValueOnce(new Error('RPC error')) // eth_call (attempt 2)
          .mockRejectedValueOnce(new Error('RPC error')) // eth_call (attempt 3)
          .mockRejectedValueOnce(new Error('RPC error')); // eth_call (attempt 4)

        await expect(
          client.getNonce({
            chainId: mockChainId,
            account: mockAccount,
            retryOptions: {
              retries: 3,
              delayMs: 100,
            },
          }),
        ).rejects.toThrow('Failed to fetch nonce');

        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(5); // 1 eth_chainId + 4 eth_call attempts
      });

      it('uses default retry options when none provided', async () => {
        const mockNonceEncoded =
          '0x0000000000000000000000000000000000000000000000000000000000000005';

        // ensureChain is called first (eth_chainId)
        mockEthereumProvider.request.mockResolvedValueOnce(mockChainIdHex); // eth_chainId from ensureChain

        // First eth_call fails, second succeeds (retry handled by callContract)
        mockEthereumProvider.request
          .mockRejectedValueOnce(new Error('RPC error')) // eth_call (first attempt)
          .mockResolvedValueOnce(mockNonceEncoded); // eth_call (retry)

        const result = await client.getNonce({
          chainId: mockChainId,
          account: mockAccount,
        });

        expect(result).toBe(5n);
        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(3);
      });

      it('succeeds on first attempt when no retry is needed', async () => {
        const mockNonceEncoded =
          '0x0000000000000000000000000000000000000000000000000000000000000005';

        // ensureChain is called first (eth_chainId)
        mockEthereumProvider.request
          .mockResolvedValueOnce(mockChainIdHex) // eth_chainId from ensureChain
          .mockResolvedValueOnce(mockNonceEncoded); // eth_call

        const result = await client.getNonce({
          chainId: mockChainId,
          account: mockAccount,
          retryOptions: {
            retries: 2,
            delayMs: 1000,
          },
        });

        expect(result).toBe(5n);
        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
      });

      it('retries on null response', async () => {
        const mockNonceEncoded =
          '0x0000000000000000000000000000000000000000000000000000000000000005';

        // ensureChain is called first (eth_chainId)
        mockEthereumProvider.request.mockResolvedValueOnce(mockChainIdHex); // eth_chainId from ensureChain

        // First eth_call returns null (throws ResourceNotFoundError), second succeeds (retry handled by callContract)
        mockEthereumProvider.request
          .mockResolvedValueOnce(null) // eth_call (first attempt - null throws ResourceNotFoundError)
          .mockResolvedValueOnce(mockNonceEncoded); // eth_call (retry)

        const result = await client.getNonce({
          chainId: mockChainId,
          account: mockAccount,
        });

        expect(result).toBe(5n);
        expect(mockEthereumProvider.request).toHaveBeenCalledTimes(3);
      });
    });
  });
});
