import { AccountApiClient } from '../../src/clients/accountApiClient';
import { zeroAddress } from 'viem';

const mockApiBaseUrl = 'https://mock-account-api.com';

describe('AccountApiClient', () => {
  const mockFetch = jest.fn();
  let client = new AccountApiClient(mockApiBaseUrl, mockFetch);

  beforeEach(() => {
    mockFetch.mockClear();
    client = new AccountApiClient(mockApiBaseUrl, mockFetch);
  });

  describe('getTokenBalanceAndMetadata', () => {
    const mockAccount = '0x4f10501E98476Bc5c7C322a8ae87226aFC8a66a2';
    const mockTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const mockChainId = 1;

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
          address: zeroAddress,
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

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
      });

      expect(result).toEqual({
        balance: BigInt('1000000000000000000'),
        decimals: 18,
        symbol: 'ETH',
        iconUrl:
          'https://dev-static.cx.metamask.io/api/v1/tokenIcons/1/0x0000000000000000000000000000000000000000.png',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockApiBaseUrl}/tokens/${zeroAddress}?accountAddresses=${mockAccount}&chainId=${mockChainId}`,
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

      expect(result).toEqual({
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
        `HTTP error. Failed to fetch token balance for account(${mockAccount}) and token(${zeroAddress}) on chain(${mockChainId}): 404`,
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
          address: zeroAddress,
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
  });
});
