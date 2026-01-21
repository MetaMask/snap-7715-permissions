import { AccountApiClient } from '../../src/clients/accountApiClient';

const mockApiBaseUrl = 'https://mock-account-api.com';
const mockTokensApiBaseUrl = 'https://mock-tokens-api.com';

describe('AccountApiClient', () => {
  const mockFetch = jest.fn();
  let client: AccountApiClient;

  beforeEach(() => {
    mockFetch.mockClear();
    client = new AccountApiClient({
      accountBaseUrl: mockApiBaseUrl,
      tokensBaseUrl: mockTokensApiBaseUrl,
      fetch: mockFetch,
      timeoutMs: 5000, // Shorter timeout for tests
      maxResponseSizeBytes: 1024 * 1024, // 1MB
    });
  });

  describe('getTokenBalance', () => {
    const mockAccount = '0x4f10501E98476Bc5c7C322a8ae87226aFC8a66a2';
    const mockTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const mockChainId = 11155111;

    it('fetches native token balance successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          balances: [
            {
              object: 'token',
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'ETH',
              decimals: 18,
              name: 'Ethereum',
              type: 'native',
              occurrences: 100,
              balance: '1.0',
              chainId: mockChainId,
            },
          ],
          unprocessedNetworks: [],
        }),
      });

      const result = await client.getTokenBalance({
        chainId: mockChainId,
        account: mockAccount,
      });

      expect(result).toBe(1000000000000000000n);

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockApiBaseUrl}/v2/accounts/${mockAccount}/balances?networks=${mockChainId}&filterSupportedTokens=false&includeTokenAddresses=0x0000000000000000000000000000000000000000&includeStakedAssets=false`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MetaMask-Snap/1.0',
            'x-metamask-clientproduct': 'gator-permissions-snap',
            'x-mmcx-internal-application': 'gator-permissions-snap',
          },
          signal: expect.any(AbortSignal),
        },
      );
    });

    it('returns zero balance when no balance found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 0,
          balances: [],
          unprocessedNetworks: [],
        }),
      });

      const result = await client.getTokenBalance({
        chainId: mockChainId,
        account: mockAccount,
        assetAddress: mockTokenAddress,
      });

      expect(result).toBe(0n);
    });

    it('returns zero balance when no balance found for the specified token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          balances: [
            {
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              balance: '1.000000000000000000',
              decimals: 18,
              symbol: 'USDC',
              name: 'USD Coin',
              object: 'token',
              chainId: 1,
            },
          ],
          unprocessedNetworks: [],
        }),
      });

      const result = await client.getTokenBalance({
        chainId: mockChainId,
        account: mockAccount,
        assetAddress: mockTokenAddress,
      });

      expect(result).toBe(0n);
    });
  });

  describe('getTokenMetadata', () => {
    const mockTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const mockChainId = 11155111;

    it('fetches token metadata successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chainId: mockChainId,
          decimals: 6,
          address: mockTokenAddress,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
          name: 'USD Coin',
          symbol: 'USDC',
        }),
      });

      const result = await client.getTokenMetadata({
        chainId: mockChainId,
        assetAddress: mockTokenAddress,
      });

      expect(result).toStrictEqual({
        decimals: 6,
        symbol: 'USDC',
        iconUrl:
          'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockTokensApiBaseUrl}/token/${mockChainId}?address=${mockTokenAddress}&includeEnrichedData=false&includeCoingeckoId=false&includeAggregators=false&includeOccurrences=false&includeIconUrl=true&includeAssetType=false&includeTokenFees=false&includeHoneypotStatus=false&includeContractVerificationStatus=false&includeStorage=false&includeERC20Permit=false&includeDescription=false`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MetaMask-Snap/1.0',
          },
          signal: expect.any(AbortSignal),
        },
      );
    });

    it('retries on 5xx status and succeeds', async () => {
      // First call fails with 503 status
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chainId: mockChainId,
          decimals: 6,
          address: mockTokenAddress,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
          name: 'USD Coin',
          symbol: 'USDC',
        }),
      });

      const result = await client.getTokenMetadata({
        chainId: mockChainId,
        assetAddress: mockTokenAddress,
        retryOptions: { retries: 1, delayMs: 100 },
      });

      expect(result).toStrictEqual({
        decimals: 6,
        symbol: 'USDC',
        iconUrl:
          'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('throws error on 404 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        client.getTokenMetadata({
          chainId: mockChainId,
          assetAddress: mockTokenAddress,
        }),
      ).rejects.toThrow('Resource not found: 404');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTokenBalanceAndMetadata', () => {
    const mockAccount = '0x4f10501E98476Bc5c7C322a8ae87226aFC8a66a2';
    const mockTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const mockChainId = 11155111;

    it('fetches native token balance and metadata successfully', async () => {
      // Mock balance API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          balances: [
            {
              object: 'token',
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'ETH',
              decimals: 18,
              name: 'Ethereum',
              type: 'native',
              occurrences: 100,
              balance: '1.0',
              chainId: mockChainId,
            },
          ],
          unprocessedNetworks: [],
        }),
      });

      // Mock metadata API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chainId: mockChainId,
          decimals: 18,
          address: '0x0000000000000000000000000000000000000000',
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
          name: 'Ethereum',
          symbol: 'ETH',
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'), // Mock content-length header
        },
      });

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
      });

      expect(result).toStrictEqual({
        balance: 1000000000000000000n,
        decimals: 18,
        symbol: 'ETH',
        iconUrl:
          'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('fetches ERC20 token balance and metadata successfully', async () => {
      // Mock balance API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          balances: [
            {
              object: 'token',
              address: mockTokenAddress,
              symbol: 'DAI',
              decimals: 18,
              name: 'Dai Stablecoin',
              type: 'erc20',
              occurrences: 100,
              balance: '2.0',
              chainId: mockChainId,
            },
          ],
          unprocessedNetworks: [],
        }),
      });

      // Mock metadata API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chainId: mockChainId,
          decimals: 18,
          address: mockTokenAddress,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
          name: 'Dai Stablecoin',
          symbol: 'DAI',
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'), // Mock content-length header
        },
      });

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
        assetAddress: mockTokenAddress,
      });

      expect(result).toStrictEqual({
        balance: 2000000000000000000n,
        decimals: 18,
        symbol: 'DAI',
        iconUrl:
          'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('handles zero balance (empty response) correctly', async () => {
      // Mock the balance API response (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 0,
          balances: [],
          unprocessedNetworks: [],
        }),
      });

      // Mock the token metadata API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chainId: mockChainId,
          decimals: 6,
          address: mockTokenAddress,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
          name: 'USD Coin',
          symbol: 'USDC',
        }),
      });

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
        assetAddress: mockTokenAddress,
      });

      expect(result).toStrictEqual({
        balance: 0n,
        decimals: 6,
        symbol: 'USDC',
        iconUrl:
          'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('handles metadata API failure gracefully', async () => {
      // Mock the balance API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          balances: [
            {
              object: 'token',
              address: mockTokenAddress,
              symbol: 'DAI',
              decimals: 18,
              name: 'Dai Stablecoin',
              type: 'erc20',
              occurrences: 100,
              balance: '1.0',
              chainId: mockChainId,
            },
          ],
          unprocessedNetworks: [],
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      });

      // Mock the token metadata API response failure (will retry once, then fail)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
        // No json method - this will cause the httpClient to throw the 404 error before trying to parse JSON
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
        // No json method - this will cause the httpClient to throw the 404 error before trying to parse JSON
      });

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          assetAddress: mockTokenAddress,
        }),
      ).rejects.toThrow('Resource not found: 404');

      expect(mockFetch).toHaveBeenCalledTimes(2); // 1 balance call + 1 metadata call (no retry on 404)
    });

    it('throws an error if response is not ok', async () => {
      // Mock both balance and metadata API responses with 404
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      });
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
      ).rejects.toThrow('Resource not found: 404');
    });

    it('throws an error if account data not found in response', async () => {
      // Mock balance API response (succeeds)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          balances: [
            {
              object: 'token',
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'ETH',
              decimals: 18,
              name: 'Ethereum',
              type: 'native',
              occurrences: 100,
              balance: '1.0',
              chainId: mockChainId,
            },
          ],
          unprocessedNetworks: [],
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      });

      // Mock metadata API response with invalid structure (missing required field)
      const mockResponse = {
        ok: true,
        json: async (): Promise<object> => ({
          // Missing required 'address' field - this will fail zod validation
          chainId: mockChainId,
          decimals: 18,
          name: 'Ethereum',
          symbol: 'ETH',
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
      ).rejects.toThrow('Invalid response structure');
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
      // Mock the metadata API call (getTokenMetadata doesn't validate account)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chainId: mockChainId,
          decimals: 18,
          address: '0x0000000000000000000000000000000000000000',
          name: 'Ethereum',
          symbol: 'ETH',
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      });

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: '' as any,
        }),
      ).rejects.toThrow('No account address provided to fetch token balance');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only metadata API call (balance API throws before making call)
    });

    it('handles token with unsupported type successfully', async () => {
      // Mock balance API response (succeeds)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          balances: [
            {
              object: 'token',
              address: mockTokenAddress,
              symbol: 'ST',
              decimals: 18,
              name: 'Some Token',
              type: 'unsupported_type',
              occurrences: 100,
              balance: '1.0',
              chainId: mockChainId,
            },
          ],
          unprocessedNetworks: [],
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      });

      // Mock metadata API response (succeeds)
      const mockResponse = {
        ok: true,
        json: async (): Promise<object> => ({
          chainId: mockChainId,
          decimals: 18,
          address: mockTokenAddress,
          name: 'Some Token',
          symbol: 'ST',
        }),
        headers: {
          get: jest.fn().mockReturnValue('1024'),
        },
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
        assetAddress: mockTokenAddress,
      });

      expect(result).toStrictEqual({
        balance: 1000000000000000000n,
        decimals: 18,
        symbol: 'ST',
      });
    });

    describe('retry logic', () => {
      it('retries once on ResourceUnavailableError (5xx status) and succeeds', async () => {
        // First balance call fails with 503 status (ResourceUnavailableError)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          // No json method - this will cause the httpClient to throw the 503 error before trying to parse JSON
        });

        // First metadata call fails with 503 status (ResourceUnavailableError)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          // No json method - this will cause the httpClient to throw the 503 error before trying to parse JSON
        });

        // Second balance call succeeds
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          json: async () => ({
            count: 1,
            balances: [
              {
                object: 'token',
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'ETH',
                decimals: 18,
                name: 'Ethereum',
                type: 'native',
                occurrences: 100,
                balance: '1.0',
                chainId: mockChainId,
              },
            ],
            unprocessedNetworks: [],
          }),
        });

        // Second metadata call succeeds
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          json: async () => ({
            chainId: mockChainId,
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000',
            name: 'Ethereum',
            symbol: 'ETH',
            iconUrl:
              'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
          }),
        });

        const result = await client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        });

        expect(result).toStrictEqual({
          balance: 1000000000000000000n,
          decimals: 18,
          symbol: 'ETH',
          iconUrl:
            'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
        });

        expect(mockFetch).toHaveBeenCalledTimes(4); // 2 balance calls + 2 metadata calls
      });

      it('retries with custom retry options', async () => {
        // Mock balance API - first call fails with 503 status
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          // No json method - this will cause the httpClient to throw the 503 error before trying to parse JSON
        });

        // Mock metadata API - first call fails with 503 status
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          // No json method - this will cause the httpClient to throw the 503 error before trying to parse JSON
        });

        // Mock balance API - second call succeeds
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          json: async () => ({
            count: 1,
            balances: [
              {
                object: 'token',
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'ETH',
                decimals: 18,
                name: 'Ethereum',
                type: 'native',
                occurrences: 100,
                balance: '1.0',
                chainId: mockChainId,
              },
            ],
            unprocessedNetworks: [],
          }),
        });

        // Mock metadata API - second call succeeds
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          json: async () => ({
            chainId: mockChainId,
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000',
            name: 'Ethereum',
            symbol: 'ETH',
            iconUrl:
              'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
          }),
        });

        const result = await client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          retryOptions: {
            retries: 2,
            delayMs: 500,
          },
        });

        expect(result).toStrictEqual({
          balance: 1000000000000000000n,
          decimals: 18,
          symbol: 'ETH',
          iconUrl:
            'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
        });

        expect(mockFetch).toHaveBeenCalledTimes(4); // 2 balance calls + 2 metadata calls
      });

      it('does not retry on ResourceNotFoundError (404 status)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          headers: {
            get: jest.fn().mockReturnValue(null),
          },
        } as any);

        await expect(
          client.getTokenBalanceAndMetadata({
            chainId: mockChainId,
            account: mockAccount,
          }),
        ).rejects.toThrow('Resource not found: 404');

        expect(mockFetch).toHaveBeenCalledTimes(2); // 1 balance call + 1 metadata call
      });

      it('does not retry on other non-5xx errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          headers: {
            get: jest.fn().mockReturnValue(null),
          },
        } as any);

        await expect(
          client.getTokenBalanceAndMetadata({
            chainId: mockChainId,
            account: mockAccount,
          }),
        ).rejects.toThrow('Client error: 400');

        expect(mockFetch).toHaveBeenCalledTimes(2); // 1 balance call + 1 metadata call
      });

      it('retries up to the specified number of attempts', async () => {
        // All calls fail with 503 status - provide 7 mock responses (4 for balance API + 3 for metadata API)
        for (let i = 0; i < 7; i++) {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 503,
            headers: {
              get: jest.fn().mockReturnValue('1024'),
            },
            // No json method - this will cause the httpClient to throw the 503 error before trying to parse JSON
          });
        }

        await expect(
          client.getTokenBalanceAndMetadata({
            chainId: mockChainId,
            account: mockAccount,
            retryOptions: {
              retries: 3,
              delayMs: 100,
            },
          }),
        ).rejects.toThrow('Server error: 503');

        expect(mockFetch).toHaveBeenCalledTimes(7); // 4 balance calls + 3 metadata calls (one API fails before making all retries)
      });

      it('uses default retry options when none provided', async () => {
        // Create a completely fresh mock for this test to avoid interference
        const freshMockFetch = jest.fn();

        // Recreate the client with the fresh mock
        client = new AccountApiClient({
          accountBaseUrl: mockApiBaseUrl,
          tokensBaseUrl: mockTokensApiBaseUrl,
          fetch: freshMockFetch,
          timeoutMs: 5000, // Shorter timeout for tests
          maxResponseSizeBytes: 1024 * 1024, // 1MB
        });

        // Mock balance API - first call fails with 503 status
        freshMockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          json: async () => {
            throw new Error('Server error: 503');
          },
        });

        // Mock metadata API - first call fails with 503 status
        freshMockFetch.mockResolvedValueOnce({
          ok: false,
          status: 503,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          json: async () => {
            throw new Error('Server error: 503');
          },
        });

        // Mock balance API - second call succeeds
        freshMockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          json: async () => ({
            count: 1,
            balances: [
              {
                object: 'token',
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'ETH',
                decimals: 18,
                name: 'Ethereum',
                type: 'native',
                occurrences: 100,
                balance: '1.0',
                chainId: mockChainId,
              },
            ],
            unprocessedNetworks: [],
          }),
        });

        // Mock metadata API - second call succeeds
        freshMockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          json: async () => ({
            chainId: mockChainId,
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000',
            name: 'Ethereum',
            symbol: 'ETH',
            iconUrl:
              'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
          }),
        });

        const result = await client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        });

        expect(result).toStrictEqual({
          balance: 1000000000000000000n,
          decimals: 18,
          symbol: 'ETH',
          iconUrl:
            'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
        });

        expect(freshMockFetch).toHaveBeenCalledTimes(4); // 2 balance calls + 2 metadata calls (with default retry)
      });

      it('succeeds on first attempt when no retry is needed', async () => {
        // Mock balance API response (succeeds)
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          json: async () => ({
            count: 1,
            balances: [
              {
                object: 'token',
                address: '0x0000000000000000000000000000000000000000',
                symbol: 'ETH',
                decimals: 18,
                name: 'Ethereum',
                type: 'native',
                occurrences: 100,
                balance: '1.0',
                chainId: mockChainId,
              },
            ],
            unprocessedNetworks: [],
          }),
        });

        // Mock metadata API response (succeeds)
        mockFetch.mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('1024'),
          },
          json: async () => ({
            chainId: mockChainId,
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000',
            name: 'Ethereum',
            symbol: 'ETH',
            iconUrl:
              'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
          }),
        });

        const result = await client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          retryOptions: {
            retries: 2,
            delayMs: 1000,
          },
        });

        expect(result).toStrictEqual({
          balance: 1000000000000000000n,
          decimals: 18,
          symbol: 'ETH',
          iconUrl:
            'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
        });

        expect(mockFetch).toHaveBeenCalledTimes(2); // 1 balance call + 1 metadata call
      });
    });
  });
});
