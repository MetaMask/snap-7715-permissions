import { PriceApiClient } from '../../src/clients/priceApiClient';

describe('PriceApiClient', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let client: PriceApiClient;

  beforeEach(() => {
    mockFetch = jest.fn();
    client = new PriceApiClient('http://localhost:8003', mockFetch);
  });

  describe('getSpotPrice', () => {
    it('fetches spot price successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'eip155:1/slip44:60': {
            usd: 1000,
          },
        }),
      } as any);

      const price = await client.getSpotPrice('eip155:1/slip44:60', 'usd');

      expect(price).toBe(1000);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8003/v3/spot-prices?includeMarketData=false&vsCurrency=usd&assetIds=eip155:1/slip44:60',
      );
    });

    it('throws an error if response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any);

      await expect(
        client.getSpotPrice('eip155:1/slip44:60', 'usd'),
      ).rejects.toThrow('Spot price not found for eip155:1/slip44:60');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8003/v3/spot-prices?includeMarketData=false&vsCurrency=usd&assetIds=eip155:1/slip44:60',
      );
    });

    it('throws an error if caip19 asset type not in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f': {
            usd: 1000,
          },
        }),
      } as any);

      await expect(
        client.getSpotPrice('eip155:1/slip44:60', 'usd'),
      ).rejects.toThrow(
        'No spot price found in result for the token CAIP-19 asset type: eip155:1/slip44:60',
      );
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8003/v3/spot-prices?includeMarketData=false&vsCurrency=usd&assetIds=eip155:1/slip44:60',
      );
    });

    it('throws an error if vsCurrency spot price for the asset type not in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'eip155:1/slip44:60': {},
        }),
      } as any);

      await expect(
        client.getSpotPrice('eip155:1/slip44:60', 'usd'),
      ).rejects.toThrow('No spot price found in result for the currency: usd');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8003/v3/spot-prices?includeMarketData=false&vsCurrency=usd&assetIds=eip155:1/slip44:60',
      );
    });

    it('throws if the caipAssetType is empty', async () => {
      await expect(client.getSpotPrice('' as any, 'usd')).rejects.toThrow(
        'No caipAssetType provided to fetch spot price',
      );
      expect(mockFetch).not.toHaveBeenCalled();
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
            'eip155:1/slip44:60': {
              usd: 1000,
            },
          }),
        } as any);

        const price = await client.getSpotPrice('eip155:1/slip44:60', 'usd');

        expect(price).toBe(1000);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockFetch).toHaveBeenNthCalledWith(
          1,
          'http://localhost:8003/v3/spot-prices?includeMarketData=false&vsCurrency=usd&assetIds=eip155:1/slip44:60',
        );
        expect(mockFetch).toHaveBeenNthCalledWith(
          2,
          'http://localhost:8003/v3/spot-prices?includeMarketData=false&vsCurrency=usd&assetIds=eip155:1/slip44:60',
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
            'eip155:1/slip44:60': {
              usd: 1000,
            },
          }),
        } as any);

        const price = await client.getSpotPrice('eip155:1/slip44:60', 'usd', {
          retries: 2,
          delayMs: 500,
        });

        expect(price).toBe(1000);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('does not retry on ResourceNotFoundError (404 status)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as any);

        await expect(
          client.getSpotPrice('eip155:1/slip44:60', 'usd'),
        ).rejects.toThrow('Spot price not found for eip155:1/slip44:60');

        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('does not retry on other non-5xx errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
        } as any);

        await expect(
          client.getSpotPrice('eip155:1/slip44:60', 'usd'),
        ).rejects.toThrow(
          'HTTP error 400: Failed to fetch spot price for eip155:1/slip44:60',
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
          client.getSpotPrice('eip155:1/slip44:60', 'usd', {
            retries: 3,
            delayMs: 100,
          }),
        ).rejects.toThrow('Price service temporarily unavailable (HTTP 500)');

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
            'eip155:1/slip44:60': {
              usd: 1000,
            },
          }),
        } as any);

        const price = await client.getSpotPrice('eip155:1/slip44:60', 'usd');

        expect(price).toBe(1000);
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('succeeds on first attempt when no retry is needed', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            'eip155:1/slip44:60': {
              usd: 1000,
            },
          }),
        } as any);

        const price = await client.getSpotPrice('eip155:1/slip44:60', 'usd', {
          retries: 2,
          delayMs: 1000,
        });

        expect(price).toBe(1000);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
