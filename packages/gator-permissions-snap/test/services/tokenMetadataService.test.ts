import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import { parseUnits, type Address } from 'viem';

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

  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678' as Address;
  const mockAssetAddress =
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Address;
  const mockTokenBalanceAndMetadata = {
    balance: parseUnits('10', 18),
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

    tokenMetadataService = new TokenMetadataService({
      accountApiClient: mockAccountApiClient,
      tokenMetadataClient: mockTokenMetadataClient,
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
        expect(result).toEqual(mockTokenBalanceAndMetadata);
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
        expect(result).toEqual(mockTokenBalanceAndMetadata);
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
          balance: parseUnits('5.5', 18),
          symbol: 'USDC',
          decimals: 6,
        };
        mockAccountApiClient.getTokenBalanceAndMetadata.mockResolvedValue(
          expectedResult,
        );

        const result =
          await tokenMetadataService.getTokenBalanceAndMetadata(baseOptions);

        expect(result).toEqual(expectedResult);
        expect(typeof result.balance).toStrictEqual('bigint');
        expect(typeof result.symbol).toStrictEqual('string');
        expect(typeof result.decimals).toStrictEqual('number');
      });
    });
  });
});
