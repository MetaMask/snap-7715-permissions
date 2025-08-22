import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import { bigIntToHex } from '@metamask/utils';

import type { PriceApiClient } from '../../src/clients/priceApiClient';
import { TokenPricesService } from '../../src/services/tokenPricesService';
import { parseUnits } from '../../src/utils/value';

describe('TokenPricesService', () => {
  const mockSnapsProvider = createMockSnapsProvider();
  const mockPriceApiClient = {
    getSpotPrice: jest.fn(),
  } as unknown as jest.Mocked<PriceApiClient>;
  let tokenPricesService: TokenPricesService;

  beforeEach(() => {
    mockSnapsProvider.request.mockReset();
    tokenPricesService = new TokenPricesService(
      mockPriceApiClient,
      mockSnapsProvider,
    );
  });

  describe('getCryptoToFiatConversion', () => {
    describe('ETH -> usd', () => {
      it('should use usd as fallback currency when no user preferences are found', async () => {
        mockPriceApiClient.getSpotPrice.mockResolvedValueOnce(1000);

        mockSnapsProvider.request.mockResolvedValueOnce(null);

        const humanReadableValue =
          await tokenPricesService.getCryptoToFiatConversion(
            'eip155:1/slip44:60',
            bigIntToHex(parseUnits({ formatted: '.01', decimals: 18 })), // 1 ETH in wei
            18,
          );

        expect(humanReadableValue).toBe('$10.00');
        expect(mockPriceApiClient.getSpotPrice).toHaveBeenCalledWith(
          'eip155:1/slip44:60',
          'usd',
        );
        expect(mockSnapsProvider.request).toHaveBeenCalledWith({
          method: 'snap_getPreferences',
        });
      });

      it('should covert the token balance(eip155:1/slip44:60) to formatted fiat human readable value(.01 ETH)', async () => {
        mockPriceApiClient.getSpotPrice.mockResolvedValueOnce(1000);

        mockSnapsProvider.request.mockResolvedValueOnce({
          locale: 'en',
          currency: 'USD',
        });

        const humanReadableValue =
          await tokenPricesService.getCryptoToFiatConversion(
            'eip155:1/slip44:60',
            bigIntToHex(parseUnits({ formatted: '.01', decimals: 18 })), // 1 ETH in wei
            18,
          );

        expect(humanReadableValue).toBe('$10.00');
        expect(mockPriceApiClient.getSpotPrice).toHaveBeenCalledWith(
          'eip155:1/slip44:60',
          'usd',
        );
        expect(mockSnapsProvider.request).toHaveBeenCalledWith({
          method: 'snap_getPreferences',
        });
      });

      it('should covert the token balance(eip155:1/slip44:60) to formatted fiat human readable value(.5 ETH)', async () => {
        mockPriceApiClient.getSpotPrice.mockResolvedValueOnce(1000);

        mockSnapsProvider.request.mockResolvedValueOnce({
          locale: 'en',
          currency: 'USD',
        });

        const humanReadableValue =
          await tokenPricesService.getCryptoToFiatConversion(
            'eip155:1/slip44:60',
            bigIntToHex(parseUnits({ formatted: '.5', decimals: 18 })), // 1 ETH in wei
            18,
          );

        expect(humanReadableValue).toBe('$500.00');
        expect(mockPriceApiClient.getSpotPrice).toHaveBeenCalledWith(
          'eip155:1/slip44:60',
          'usd',
        );
        expect(mockSnapsProvider.request).toHaveBeenCalledWith({
          method: 'snap_getPreferences',
        });
      });

      it('should covert the token balance(eip155:1/slip44:60) to formatted fiat human readable value(1 ETH)', async () => {
        mockPriceApiClient.getSpotPrice.mockResolvedValueOnce(1000);

        mockSnapsProvider.request.mockResolvedValueOnce({
          locale: 'en',
          currency: 'USD',
        });

        const humanReadableValue =
          await tokenPricesService.getCryptoToFiatConversion(
            'eip155:1/slip44:60',
            bigIntToHex(parseUnits({ formatted: '1', decimals: 18 })), // 1 ETH in wei
            18,
          );

        expect(humanReadableValue).toBe('$1,000.00');
        expect(mockPriceApiClient.getSpotPrice).toHaveBeenCalledWith(
          'eip155:1/slip44:60',
          'usd',
        );
        expect(mockSnapsProvider.request).toHaveBeenCalledWith({
          method: 'snap_getPreferences',
        });
      });

      it('should covert the token balance(eip155:1/slip44:60) to formatted fiat human readable value(1.5 ETH)', async () => {
        mockPriceApiClient.getSpotPrice.mockResolvedValueOnce(1000);

        mockSnapsProvider.request.mockResolvedValueOnce({
          locale: 'en',
          currency: 'USD',
        });

        const humanReadableValue =
          await tokenPricesService.getCryptoToFiatConversion(
            'eip155:1/slip44:60',
            bigIntToHex(parseUnits({ formatted: '1.5', decimals: 18 })), // 1.5 ETH in wei
            18,
          );

        expect(humanReadableValue).toBe('$1,500.00');
        expect(mockPriceApiClient.getSpotPrice).toHaveBeenCalledWith(
          'eip155:1/slip44:60',
          'usd',
        );
        expect(mockSnapsProvider.request).toHaveBeenCalledWith({
          method: 'snap_getPreferences',
        });
      });

      it('should use default message if there is an error when calculating the fiat human readable value', async () => {
        mockPriceApiClient.getSpotPrice.mockRejectedValue(new Error('error'));

        mockSnapsProvider.request.mockResolvedValueOnce({
          locale: 'en',
          currency: 'USD',
        });

        const humanReadableValue =
          await tokenPricesService.getCryptoToFiatConversion(
            'eip155:1/slip44:60',
            bigIntToHex(parseUnits({ formatted: '.01', decimals: 18 })), // 1 ETH in wei
            18,
          );

        expect(humanReadableValue).toBe(' ');
        expect(mockPriceApiClient.getSpotPrice).toHaveBeenCalledWith(
          'eip155:1/slip44:60',
          'usd',
        );
        expect(mockSnapsProvider.request).toHaveBeenCalledWith({
          method: 'snap_getPreferences',
        });
      });
    });
  });
});
