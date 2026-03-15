import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import type { Hex } from '@metamask/delegation-core';

import type { AccountApiClient } from '../../src/clients/accountApiClient';
import type { TokenMetadataClient } from '../../src/clients/types';
import { TokenMetadataService } from '../../src/services/tokenMetadataService';
import type { GetTokenBalanceAndMetadataOptions } from '../../src/services/tokenMetadataService';
import { parseUnits } from '../../src/utils/value';

describe('TokenMetadataService', () => {
  let tokenMetadataService: TokenMetadataService;
  let mockAccountApiClient: jest.Mocked<AccountApiClient>;
  let mockTokenMetadataClient: jest.Mocked<TokenMetadataClient>;
  let mockFetcher: jest.MockedFunction<typeof fetch>;

  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
  const mockAssetAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Hex;
  const mockTokenBalanceAndMetadata = {
    balance: parseUnits({ formatted: '10', decimals: 18 }),
    symbol: 'ETH',
    decimals: 18,
  };

  beforeEach(() => {
    mockAccountApiClient = {
      isChainIdSupported: jest.fn(),
      getTokenBalanceAndMetadata: jest.fn(),
    } as unknown as jest.Mocked<AccountApiClient>;

    mockTokenMetadataClient = {
      getTokenBalanceAndMetadata: jest.fn(),
    } as unknown as jest.Mocked<TokenMetadataClient>;

    mockFetcher = jest.fn();

    tokenMetadataService = new TokenMetadataService({
      accountApiClient: mockAccountApiClient,
      tokenMetadataClient: mockTokenMetadataClient,
      fetcher: mockFetcher,
    });
  });

  describe('constructor', () => {
    it('should initialize with provided clients', () => {
      expect(tokenMetadataService).toBeInstanceOf(TokenMetadataService);
    });
  });

  describe('getTokenBalanceAndMetadata', () => {
    const baseOptions: GetTokenBalanceAndMetadataOptions = {
      chainId: 1,
      account: mockAddress,
    };

    describe('when AccountApiClient supports the chain', () => {
      beforeEach(() => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(true);
        mockAccountApiClient.getTokenBalanceAndMetadata.mockResolvedValue(
          mockTokenBalanceAndMetadata,
        );
      });

      it('should use AccountApiClient for supported chains', async () => {
        const result =
          await tokenMetadataService.getTokenBalanceAndMetadata(baseOptions);

        expect(mockAccountApiClient.isChainIdSupported).toHaveBeenCalledWith({
          chainId: 1,
        });
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledWith({
          chainId: 1,
          account: mockAddress,
          assetAddress: undefined,
        });
        expect(
          mockTokenMetadataClient.getTokenBalanceAndMetadata,
        ).not.toHaveBeenCalled();
        expect(result).toStrictEqual(mockTokenBalanceAndMetadata);
      });

      it('should pass assetAddress when provided', async () => {
        const optionsWithAsset = {
          ...baseOptions,
          assetAddress: mockAssetAddress,
        };

        await tokenMetadataService.getTokenBalanceAndMetadata(optionsWithAsset);

        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledWith({
          chainId: 1,
          account: mockAddress,
          assetAddress: mockAssetAddress,
        });
      });

      it('should handle native token requests (no assetAddress)', async () => {
        await tokenMetadataService.getTokenBalanceAndMetadata(baseOptions);

        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledWith({
          chainId: 1,
          account: mockAddress,
          assetAddress: undefined,
        });
      });
    });

    describe('when AccountApiClient does not support the chain', () => {
      beforeEach(() => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(false);
        mockTokenMetadataClient.getTokenBalanceAndMetadata.mockResolvedValue(
          mockTokenBalanceAndMetadata,
        );
      });

      it('should use TokenMetadataClient for unsupported chains', async () => {
        const result =
          await tokenMetadataService.getTokenBalanceAndMetadata(baseOptions);

        expect(mockAccountApiClient.isChainIdSupported).toHaveBeenCalledWith({
          chainId: 1,
        });
        expect(
          mockTokenMetadataClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledWith({
          chainId: 1,
          account: mockAddress,
          assetAddress: undefined,
        });
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).not.toHaveBeenCalled();
        expect(result).toStrictEqual(mockTokenBalanceAndMetadata);
      });

      it('should pass assetAddress when provided', async () => {
        const optionsWithAsset = {
          ...baseOptions,
          assetAddress: mockAssetAddress,
        };

        await tokenMetadataService.getTokenBalanceAndMetadata(optionsWithAsset);

        expect(
          mockTokenMetadataClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledWith({
          chainId: 1,
          account: mockAddress,
          assetAddress: mockAssetAddress,
        });
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(true);
      });

      it('should fallback to blockchain client when AccountApiClient fails', async () => {
        const networkError = new Error('Network timeout');
        mockAccountApiClient.getTokenBalanceAndMetadata.mockRejectedValue(
          networkError,
        );
        mockTokenMetadataClient.getTokenBalanceAndMetadata.mockResolvedValue(
          mockTokenBalanceAndMetadata,
        );

        const result =
          await tokenMetadataService.getTokenBalanceAndMetadata(baseOptions);

        // Verify fallback occurred
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledWith({
          chainId: 1,
          account: mockAddress,
          assetAddress: undefined,
        });
        expect(
          mockTokenMetadataClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledWith({
          chainId: 1,
          account: mockAddress,
          assetAddress: undefined,
        });
        expect(result).toStrictEqual(mockTokenBalanceAndMetadata);
      });

      it('should propagate errors from TokenMetadataClient when no fallback available', async () => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(false);
        const error = new Error('TokenMetadata error');
        mockTokenMetadataClient.getTokenBalanceAndMetadata.mockRejectedValue(
          error,
        );

        await expect(
          tokenMetadataService.getTokenBalanceAndMetadata(baseOptions),
        ).rejects.toThrow('TokenMetadata error');
      });

      it('should throw the last error when both clients fail', async () => {
        const accountApiError = new Error('Account API network error');
        const tokenMetadataError = new Error('TokenMetadata network error');

        mockAccountApiClient.getTokenBalanceAndMetadata.mockRejectedValue(
          accountApiError,
        );
        mockTokenMetadataClient.getTokenBalanceAndMetadata.mockRejectedValue(
          tokenMetadataError,
        );

        await expect(
          tokenMetadataService.getTokenBalanceAndMetadata(baseOptions),
        ).rejects.toThrow('TokenMetadata network error');

        // Verify both clients were tried
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledWith({
          chainId: 1,
          account: mockAddress,
          assetAddress: undefined,
        });
        expect(
          mockTokenMetadataClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledWith({
          chainId: 1,
          account: mockAddress,
          assetAddress: undefined,
        });
      });
    });

    describe('different chain scenarios', () => {
      it('should handle mainnet (chain ID 1)', async () => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(true);
        mockAccountApiClient.getTokenBalanceAndMetadata.mockResolvedValue(
          mockTokenBalanceAndMetadata,
        );

        const options = { ...baseOptions, chainId: 1 };
        await tokenMetadataService.getTokenBalanceAndMetadata(options);

        expect(mockAccountApiClient.isChainIdSupported).toHaveBeenCalledWith({
          chainId: 1,
        });
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalled();
      });

      it('should handle testnets', async () => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(false);
        mockTokenMetadataClient.getTokenBalanceAndMetadata.mockResolvedValue(
          mockTokenBalanceAndMetadata,
        );

        const options = { ...baseOptions, chainId: 11155111 }; // Sepolia
        await tokenMetadataService.getTokenBalanceAndMetadata(options);

        expect(mockAccountApiClient.isChainIdSupported).toHaveBeenCalledWith({
          chainId: 11155111,
        });
        expect(
          mockTokenMetadataClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalled();
      });
    });

    describe('return value validation', () => {
      beforeEach(() => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(true);
      });

      it('should return correct balance data structure', async () => {
        const expectedResult = {
          balance: parseUnits({ formatted: '5.5', decimals: 18 }),
          symbol: 'USDC',
          decimals: 6,
        };
        mockAccountApiClient.getTokenBalanceAndMetadata.mockResolvedValue(
          expectedResult,
        );

        const result =
          await tokenMetadataService.getTokenBalanceAndMetadata(baseOptions);

        expect(result).toStrictEqual(expectedResult);
        expect(typeof result.balance).toBe('bigint');
        expect(typeof result.symbol).toBe('string');
        expect(typeof result.decimals).toBe('number');
      });
    });
  });

  describe('fetchIconDataAsBase64', () => {
    const mockIconUrl = 'https://example.com/icon.png';

    it('successfully fetches and converts icon to base64', async () => {
      /* eslint-disable no-restricted-globals */
      const mockImageData = Buffer.from('mock image data', 'utf8');
      const expectedBase64 = `data:image/png;base64,${mockImageData.toString('base64')}`;

      const arrayBuffer = new ArrayBuffer(mockImageData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      uint8Array.set(mockImageData);

      const response = {
        ok: true,
        arrayBuffer: jest.fn(async () => Promise.resolve(mockImageData)),
      };

      mockFetcher.mockResolvedValueOnce(response as unknown as Response);

      const result =
        await tokenMetadataService.fetchIconDataAsBase64(mockIconUrl);

      expect(response.arrayBuffer).toHaveBeenCalledTimes(1);
      expect(mockFetcher).toHaveBeenCalledWith(mockIconUrl);
      expect(result).toStrictEqual({
        success: true,
        imageDataBase64: expectedBase64,
      });
    });

    it('returns success false when iconUrl is undefined', async () => {
      const result =
        await tokenMetadataService.fetchIconDataAsBase64(undefined);

      expect(mockFetcher).not.toHaveBeenCalled();
      expect(result).toStrictEqual({
        success: false,
      });
    });

    it('returns success false when iconUrl is empty string', async () => {
      const result = await tokenMetadataService.fetchIconDataAsBase64('');

      expect(mockFetcher).not.toHaveBeenCalled();
      expect(result).toStrictEqual({
        success: false,
      });
    });

    it('returns success false when fetch response is not ok', async () => {
      mockFetcher.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result =
        await tokenMetadataService.fetchIconDataAsBase64(mockIconUrl);

      expect(mockFetcher).toHaveBeenCalledWith(mockIconUrl);
      expect(result).toStrictEqual({
        success: false,
      });
    });

    it('returns success false when fetch throws an error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      mockFetcher.mockRejectedValueOnce(new Error('Network error'));

      const result =
        await tokenMetadataService.fetchIconDataAsBase64(mockIconUrl);

      expect(mockFetcher).toHaveBeenCalledWith(mockIconUrl);
      expect(result).toStrictEqual({
        success: false,
      });

      consoleErrorSpy.mockRestore();
    });

    it('returns success false when arrayBuffer() throws an error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');

      mockFetcher.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => Promise.reject(new Error('ArrayBuffer error')),
      } as Response);

      const result =
        await tokenMetadataService.fetchIconDataAsBase64(mockIconUrl);

      expect(mockFetcher).toHaveBeenCalledWith(mockIconUrl);
      expect(result).toStrictEqual({
        success: false,
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('constructor with default fetcher', () => {
    it('uses global fetch when no fetcher is provided', () => {
      const serviceWithDefaultFetcher = new TokenMetadataService({
        accountApiClient: mockAccountApiClient,
        tokenMetadataClient: mockTokenMetadataClient,
      });

      expect(serviceWithDefaultFetcher).toBeInstanceOf(TokenMetadataService);
    });
  });

  describe('getTokenMetadata', () => {
    const baseOptions: GetTokenBalanceAndMetadataOptions = {
      chainId: 1,
      account: mockAddress,
    };

    describe('caching behavior', () => {
      beforeEach(() => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(true);
        mockAccountApiClient.getTokenBalanceAndMetadata.mockResolvedValue(
          mockTokenBalanceAndMetadata,
        );
      });

      it('should return metadata without balance', async () => {
        const result = await tokenMetadataService.getTokenMetadata(baseOptions);

        expect(result).toStrictEqual({
          symbol: 'ETH',
          decimals: 18,
        });
        expect(result).not.toHaveProperty('balance');
      });

      it('should cache metadata on first call', async () => {
        await tokenMetadataService.getTokenMetadata(baseOptions);

        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledTimes(1);
      });

      it('should return cached metadata on subsequent calls without fetching', async () => {
        // First call
        await tokenMetadataService.getTokenMetadata(baseOptions);
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledTimes(1);

        // Second call with same params
        const result = await tokenMetadataService.getTokenMetadata(baseOptions);

        // Should not have called the client again
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledTimes(1);
        expect(result).toStrictEqual({
          symbol: 'ETH',
          decimals: 18,
        });
      });

      it('should use separate cache entries for different assets on same chain', async () => {
        // First call for native token
        await tokenMetadataService.getTokenMetadata(baseOptions);

        // Second call for specific asset
        mockAccountApiClient.getTokenBalanceAndMetadata.mockResolvedValueOnce({
          ...mockTokenBalanceAndMetadata,
          symbol: 'USDC',
          decimals: 6,
        });

        const assetOptions = {
          ...baseOptions,
          assetAddress: mockAssetAddress,
        };
        const assetResult =
          await tokenMetadataService.getTokenMetadata(assetOptions);

        // Should have called the client twice (once for each asset)
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledTimes(2);
        expect(assetResult).toStrictEqual({
          symbol: 'USDC',
          decimals: 6,
        });
      });

      it('should use separate cache entries for different chains with same asset', async () => {
        // First call for chain 1
        await tokenMetadataService.getTokenMetadata(baseOptions);

        // Second call for chain 137 (Polygon)
        mockAccountApiClient.getTokenBalanceAndMetadata.mockResolvedValueOnce(
          mockTokenBalanceAndMetadata,
        );

        const polygonOptions = { ...baseOptions, chainId: 137 };
        await tokenMetadataService.getTokenMetadata(polygonOptions);

        // Should have called the client twice (once for each chain)
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledTimes(2);
      });

      it('should cache metadata alongside balance in getTokenBalanceAndMetadata', async () => {
        // First call getTokenBalanceAndMetadata which caches metadata
        await tokenMetadataService.getTokenBalanceAndMetadata(baseOptions);
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledTimes(1);

        // Second call getTokenMetadata which should use cache
        const metadata =
          await tokenMetadataService.getTokenMetadata(baseOptions);

        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledTimes(1); // No additional call
        expect(metadata).toStrictEqual({
          symbol: 'ETH',
          decimals: 18,
        });
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(true);
      });

      it('should fallback to blockchain client when AccountApiClient fails', async () => {
        const networkError = new Error('Network timeout');
        mockAccountApiClient.getTokenBalanceAndMetadata.mockRejectedValue(
          networkError,
        );
        mockTokenMetadataClient.getTokenBalanceAndMetadata.mockResolvedValue(
          mockTokenBalanceAndMetadata,
        );

        const result = await tokenMetadataService.getTokenMetadata(baseOptions);

        expect(result).toStrictEqual({
          symbol: 'ETH',
          decimals: 18,
        });
      });

      it('should throw error when all clients fail', async () => {
        const error = new Error('All clients failed');
        mockAccountApiClient.getTokenBalanceAndMetadata.mockRejectedValue(
          error,
        );
        mockTokenMetadataClient.getTokenBalanceAndMetadata.mockRejectedValue(
          error,
        );

        await expect(
          tokenMetadataService.getTokenMetadata(baseOptions),
        ).rejects.toThrow('All clients failed');
      });
    });

    describe('with different chain scenarios', () => {
      it('should cache metadata for unsupported chains', async () => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(false);
        mockTokenMetadataClient.getTokenBalanceAndMetadata.mockResolvedValue(
          mockTokenBalanceAndMetadata,
        );

        // First call
        await tokenMetadataService.getTokenMetadata(baseOptions);

        // Second call should use cache
        const result = await tokenMetadataService.getTokenMetadata(baseOptions);

        expect(
          mockTokenMetadataClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledTimes(1);
        expect(result).toStrictEqual({
          symbol: 'ETH',
          decimals: 18,
        });
      });
    });

    describe('concurrent request handling', () => {
      beforeEach(() => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(true);
        // Simulate a slow fetch to ensure we can test concurrency
        mockAccountApiClient.getTokenBalanceAndMetadata.mockImplementation(
          async () =>
            new Promise((resolve) => {
              setTimeout(() => resolve(mockTokenBalanceAndMetadata), 10);
            }),
        );
      });

      it('should deduplicate concurrent requests for the same metadata', async () => {
        // Fire two concurrent requests for the same metadata
        const [result1, result2] = await Promise.all([
          tokenMetadataService.getTokenMetadata(baseOptions),
          tokenMetadataService.getTokenMetadata(baseOptions),
        ]);

        // Both should get the same result
        expect(result1).toStrictEqual({
          symbol: 'ETH',
          decimals: 18,
        });
        expect(result2).toStrictEqual({
          symbol: 'ETH',
          decimals: 18,
        });

        // But the client should only be called once
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).toHaveBeenCalledTimes(1);
      });

      it('should cache metadata after concurrent requests resolve', async () => {
        // Fire two concurrent requests
        await Promise.all([
          tokenMetadataService.getTokenMetadata(baseOptions),
          tokenMetadataService.getTokenMetadata(baseOptions),
        ]);

        // Reset the mock
        mockAccountApiClient.getTokenBalanceAndMetadata.mockClear();

        // Third call should use cache
        const result = await tokenMetadataService.getTokenMetadata(baseOptions);

        expect(result).toStrictEqual({
          symbol: 'ETH',
          decimals: 18,
        });
        // Should not call the client again
        expect(
          mockAccountApiClient.getTokenBalanceAndMetadata,
        ).not.toHaveBeenCalled();
      });
    });
  });
});
