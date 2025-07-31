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

    it('throws an error if selected chain does not match requested chain', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce('0x01'); // eth_chainId

      await expect(
        client.getNonce({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Selected chain does not match the requested chain');
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
  });
});
