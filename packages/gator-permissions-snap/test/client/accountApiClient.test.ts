import { AccountApiClient } from '../../src/clients/accountApiClient';

const mockApiBaseUrl = 'https://mock-account-api.com';

describe('AccountApiClient', () => {
  const mockFetch = jest.fn();
  let client = new AccountApiClient({
    baseUrl: mockApiBaseUrl,
    fetch: mockFetch,
  });

  beforeEach(() => {
    mockFetch.mockClear();
    client = new AccountApiClient({
      baseUrl: mockApiBaseUrl,
      fetch: mockFetch,
    });
  });

  describe('getTokenBalanceAndMetadata', () => {
    const mockAccount = '0x4f10501E98476Bc5c7C322a8ae87226aFC8a66a2';
    const mockTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const mockChainId = 11155111;

    it('fetches native token balance and metadata successfully', async () => {
      mockFetch.mockResolvedValueOnce({
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
          blockNumber: 'latest',
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
      });

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
      );
    });

    it('fetches ERC20 token balance and metadata successfully', async () => {
      mockFetch.mockResolvedValueOnce({
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
          blockNumber: 'latest',
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
      });

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
      );
    });

    it('throws an error if response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow(
        `Token balance not found for account ${mockAccount} and token 0x0000000000000000000000000000000000000000`,
      );
    });

    it('throws an error if account data not found in response', async () => {
      mockFetch.mockResolvedValueOnce({
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
          blockNumber: 'latest',
          updatedAt: '2025-05-29T23:14:08.118Z',
          value: {},
          price: 0,
          accounts: [], // Empty accounts array
        }),
      });

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow(
        `No balance data found for the account: ${mockAccount}`,
      );
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
      mockFetch.mockResolvedValueOnce({
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
          blockNumber: 'latest',
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
      });

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          assetAddress: mockTokenAddress,
        }),
      ).rejects.toThrow('Unsupported token type: unsupported_type');
    });

    describe('retry logic', () => {
      it('retries once on ResourceUnavailableError (5xx status) and succeeds', async () => {
        // First call fails with 500 status (ResourceUnavailableError)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as any);

        // Second call succeeds
        mockFetch.mockResolvedValueOnce({
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
            blockNumber: 'latest',
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
        } as any);

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

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenNthCalledWith(
          1,
          `${mockApiBaseUrl}/tokens/0x0000000000000000000000000000000000000000?accountAddresses=${mockAccount}&chainId=${mockChainId}`,
        );
        expect(mockFetch).toHaveBeenNthCalledWith(
          2,
          `${mockApiBaseUrl}/tokens/0x0000000000000000000000000000000000000000?accountAddresses=${mockAccount}&chainId=${mockChainId}`,
        );
      });

      it('retries with custom retry options', async () => {
        // First call fails with 500 status
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as any);

        // Second call succeeds
        mockFetch.mockResolvedValueOnce({
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
            blockNumber: 'latest',
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
        } as any);

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
          iconUrl:
            'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
        });

        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('does not retry on ResourceNotFoundError (404 status)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as any);

        await expect(
          client.getTokenBalanceAndMetadata({
            chainId: mockChainId,
            account: mockAccount,
          }),
        ).rejects.toThrow(
          `Token balance not found for account ${mockAccount} and token 0x0000000000000000000000000000000000000000`,
        );

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('does not retry on other non-5xx errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
        } as any);

        await expect(
          client.getTokenBalanceAndMetadata({
            chainId: mockChainId,
            account: mockAccount,
          }),
        ).rejects.toThrow(
          `HTTP error 400: Failed to fetch token balance for account ${mockAccount} and token 0x0000000000000000000000000000000000000000`,
        );

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('retries up to the specified number of attempts', async () => {
        // All calls fail with 500 status
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
        } as any);

        await expect(
          client.getTokenBalanceAndMetadata({
            chainId: mockChainId,
            account: mockAccount,
            retryOptions: {
              retries: 3,
              delayMs: 100,
            },
          }),
        ).rejects.toThrow('Account service temporarily unavailable (HTTP 500)');

        expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
      });

      it('uses default retry options when none provided', async () => {
        // First call fails with 500 status
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as any);

        // Second call succeeds
        mockFetch.mockResolvedValueOnce({
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
            blockNumber: 'latest',
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
        } as any);

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

        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('succeeds on first attempt when no retry is needed', async () => {
        mockFetch.mockResolvedValueOnce({
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
            blockNumber: 'latest',
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
        } as any);

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
          iconUrl:
            'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
