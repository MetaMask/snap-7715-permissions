import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import type { Hex } from '@metamask/delegation-core';

import { parseUnits } from '../../src/utils/value';
import type { AccountApiClient } from '../../src/clients/accountApiClient';
import type { TokenMetadataClient } from '../../src/clients/types';
import {
  TokenMetadataService,
  type GetTokenBalanceAndMetadataOptions,
} from '../../src/services/tokenMetadataService';

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

      it('should propagate errors from AccountApiClient', async () => {
        const error = new Error('AccountAPI error');
        mockAccountApiClient.getTokenBalanceAndMetadata.mockRejectedValue(
          error,
        );

        await expect(
          tokenMetadataService.getTokenBalanceAndMetadata(baseOptions),
        ).rejects.toThrow('AccountAPI error');
      });

      it('should propagate errors from TokenMetadataClient', async () => {
        mockAccountApiClient.isChainIdSupported.mockReturnValue(false);
        const error = new Error('TokenMetadata error');
        mockTokenMetadataClient.getTokenBalanceAndMetadata.mockRejectedValue(
          error,
        );

        await expect(
          tokenMetadataService.getTokenBalanceAndMetadata(baseOptions),
        ).rejects.toThrow('TokenMetadata error');
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
});
