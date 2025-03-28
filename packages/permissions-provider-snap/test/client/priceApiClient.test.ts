import { PriceApiClient } from '../../src/clients';

describe('PriceApiClient', () => {
  const mockFetch = jest.fn();
  let client = new PriceApiClient('http://localhost:8003', mockFetch);

  beforeEach(() => {
    mockFetch.mockClear();
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
      });

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
      });

      await expect(
        client.getSpotPrice('eip155:1/slip44:60', 'usd'),
      ).rejects.toThrow(
        'HTTP error! Failed to fetch spot price for caipAssetType(eip155:1/slip44:60) and vsCurrency(usd): 404',
      );
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
      });

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
      });

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
  });
});
