import { AccountApiClient } from '../../src/clients/accountApiClient';

const mockApiBaseUrl = 'https://mock-account-api.com';

describe('AccountApiClient', () => {
  const mockFetch = jest.fn();
  let client: AccountApiClient;

  beforeEach(() => {
    mockFetch.mockClear();
    client = new AccountApiClient({
      baseUrl: mockApiBaseUrl,
      fetch: mockFetch,
      timeoutMs: 5000, // Shorter timeout for tests
      maxResponseSizeBytes: 1024 * 1024, // 1MB
    });
  });

  describe('getTokenBalanceAndMetadata', () => {
    const mockAccount = '0x4f10501E98476Bc5c7C322a8ae87226aFC8a66a2';
    const mockTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const mockChainId = 11155111;

    it('fetches native token balance and metadata successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
          type: 'native',
          iconUrl:
            'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
          coingeckoId: 'ethereum',
          address: '0x0000000000000000000000000000000000000000',
          occurrences: 100,
          sources: [],
          chainId: mockChainId,
          blockNumber: '12345678',
          updatedAt: '2025-05-29T23:14:08.118Z',
          value: {},
          price: 0,
          accounts: [
            {
              accountAddress: mockAccount,
              chainId: mockChainId,
              rawBalance: '1000000000000000000',
              balance: 1,
            },
          ],
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'), // Mock content-length header
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
      });

      expect(result).toStrictEqual({
        balance: BigInt('1000000000000000000'),
        decimals: 18,
        symbol: 'ETH',
        iconUrl:
          'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockApiBaseUrl}/tokens/0x0000000000000000000000000000000000000000?accountAddresses=${mockAccount}&chainId=${mockChainId}`,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          headers: expect.objectContaining({
            Accept: 'application/json',
            'User-Agent': 'MetaMask-Snap/1.0',
          }),
        }),
      );
    });

    it('fetches ERC20 token balance and metadata successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          name: 'Dai Stablecoin',
          symbol: 'DAI',
          decimals: 18,
          type: 'erc20',
          iconUrl:
            'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
          coingeckoId: 'dai',
          address: mockTokenAddress,
          occurrences: 100,
          sources: [],
          chainId: 1,
          blockNumber: '12345678',
          updatedAt: '2025-05-29T23:14:08.118Z',
          value: {},
          price: 0,
          accounts: [
            {
              accountAddress: mockAccount,
              chainId: mockChainId,
              rawBalance: '2000000000000000000',
              balance: 2,
            },
          ],
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'), // Mock content-length header
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
        assetAddress: mockTokenAddress,
      });

      expect(result).toStrictEqual({
        balance: BigInt('2000000000000000000'),
        decimals: 18,
        symbol: 'DAI',
        iconUrl:
          'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockApiBaseUrl}/tokens/${mockTokenAddress}?accountAddresses=${mockAccount}&chainId=${mockChainId}`,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          headers: expect.objectContaining({
            Accept: 'application/json',
            'User-Agent': 'MetaMask-Snap/1.0',
          }),
        }),
      );
    });

    it('throws an error if response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      });

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow(
        `HTTP error. Failed to fetch token balance for account(${mockAccount}) and token(0x0000000000000000000000000000000000000000) on chain(${mockChainId}): 404`,
      );
    });

    it('throws an error if account data not found in response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
          type: 'native',
          iconUrl:
            'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
          coingeckoId: 'ethereum',
          address: '0x0000000000000000000000000000000000000000',
          occurrences: 100,
          sources: [],
          chainId: 1,
          blockNumber: '12345678',
          updatedAt: '2025-05-29T23:14:08.118Z',
          value: {},
          price: 0,
          accounts: [], // Empty accounts array - this will fail zod validation
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Invalid response structure from token balance API');
    });

    it('throws if chainId is not provided', async () => {
      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: 0,
          account: mockAccount,
        }),
      ).rejects.toThrow('No chainId provided to fetch token balance');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws if account is not provided', async () => {
      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: '' as any,
        }),
      ).rejects.toThrow('No account address provided to fetch token balance');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws if unsupported token type is returned', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          name: 'Some Token',
          symbol: 'ST',
          decimals: 18,
          type: 'unsupported_type',
          iconUrl: 'https://example.com/icon.png',
          coingeckoId: 'some-token',
          address: mockTokenAddress,
          occurrences: 100,
          sources: [],
          chainId: 1,
          blockNumber: '12345678',
          updatedAt: '2025-05-29T23:14:08.118Z',
          value: {},
          price: 0,
          accounts: [
            {
              accountAddress: mockAccount,
              chainId: mockChainId,
              rawBalance: '1000000000000000000',
              balance: 1,
            },
          ],
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          assetAddress: mockTokenAddress,
        }),
      ).rejects.toThrow('Unsupported token type: unsupported_type');
    });

    it('throws an error for invalid JSON response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Failed to parse JSON response from token balance API');
    });

    it('throws an error for invalid response structure', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          // Missing required fields
          name: 'Ethereum',
          // symbol: 'ETH', // Missing
          decimals: 18,
          type: 'native',
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Invalid response structure from token balance API');
    });

    it('throws an error for response that exceeds size limit', async () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('2097152'), // 2MB - exceeds 1MB limit
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow(
        'Response too large: 2097152 bytes exceeds limit of 1048576 bytes',
      );
    });

    it('throws an error for request timeout', async () => {
      mockFetch.mockImplementationOnce(
        async () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              const error = new Error('Request timed out');
              error.name = 'AbortError';
              reject(error);
            }, 100);
          }),
      );

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Request timed out after 5000ms');
    });

    it('sanitizes iconUrl to only allow HTTPS URLs', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
          type: 'native',
          iconUrl: 'http://insecure.example.com/icon.png', // HTTP instead of HTTPS
          coingeckoId: 'ethereum',
          address: '0x0000000000000000000000000000000000000000',
          occurrences: 100,
          sources: [],
          chainId: mockChainId,
          blockNumber: '12345678',
          updatedAt: '2025-05-29T23:14:08.118Z',
          value: {},
          price: 0,
          accounts: [
            {
              accountAddress: mockAccount,
              chainId: mockChainId,
              rawBalance: '1000000000000000000',
              balance: 1,
            },
          ],
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
      });

      expect(result.iconUrl).toBeUndefined(); // Should be sanitized out
    });

    it('throws an error for invalid balance format', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
          type: 'native',
          iconUrl: 'https://example.com/icon.png',
          coingeckoId: 'ethereum',
          address: '0x0000000000000000000000000000000000000000',
          occurrences: 100,
          sources: [],
          chainId: mockChainId,
          blockNumber: '12345678',
          updatedAt: '2025-05-29T23:14:08.118Z',
          value: {},
          price: 0,
          accounts: [
            {
              accountAddress: mockAccount,
              chainId: mockChainId,
              rawBalance: 'invalid-balance', // Invalid balance format - caught by zod validation
              balance: 1,
            },
          ],
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Invalid response structure from token balance API');
    });
  });
});
