import { describe, expect, it, beforeEach } from '@jest/globals';
import type { Hex } from 'viem';

import {
  fetchIconDataAsBase64,
  getIconData,
} from '../../src/permissions/iconUtil';
import type { BaseTokenPermissionContext } from '../../src/core/types';

describe('iconUtil', () => {
  describe('fetchIconDataAsBase64', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      mockFetch = jest.fn();
    });

    describe('success cases', () => {
      it('should successfully fetch and convert icon to base64', async () => {
        const mockImageData = 'test image data';
        const mockArrayBuffer = new TextEncoder().encode(mockImageData).buffer;
        const expectedBase64 = Buffer.from(mockArrayBuffer).toString('base64');

        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockArrayBuffer),
        } as Response);

        const result = await fetchIconDataAsBase64({
          iconUrl: 'https://example.com/icon.png',
          fetcher: mockFetch,
        });

        expect(result).toEqual({
          success: true,
          imageDataBase64: `data:image/png;base64,${expectedBase64}`,
        });
        expect(mockFetch).toHaveBeenCalledWith('https://example.com/icon.png');
      });

      it('should handle binary image data correctly', async () => {
        // Create a mock binary image data (simulating PNG header)
        const mockBinaryData = new Uint8Array([
          137, 80, 78, 71, 13, 10, 26, 10,
        ]);
        const mockArrayBuffer = mockBinaryData.buffer;

        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockArrayBuffer),
        } as Response);

        const result = await fetchIconDataAsBase64({
          iconUrl: 'https://example.com/icon.png',
          fetcher: mockFetch,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.imageDataBase64).toMatch(/^data:image\/png;base64,/);
          expect(result.imageDataBase64.length).toBeGreaterThan(30);
        }
      });

      it('should use default fetch when no fetcher is provided', async () => {
        const originalFetch = global.fetch;
        const mockGlobalFetch = jest.fn();
        global.fetch = mockGlobalFetch;

        const mockArrayBuffer = new TextEncoder().encode('test').buffer;
        mockGlobalFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockArrayBuffer),
        } as Response);

        const result = await fetchIconDataAsBase64({
          iconUrl: 'https://example.com/icon.png',
        });

        expect(result.success).toBe(true);
        expect(mockGlobalFetch).toHaveBeenCalledWith(
          'https://example.com/icon.png',
        );

        global.fetch = originalFetch;
      });
    });

    describe('failure cases', () => {
      it('should return failure when iconUrl is undefined', async () => {
        const result = await fetchIconDataAsBase64({
          iconUrl: undefined,
          fetcher: mockFetch,
        });

        expect(result).toEqual({ success: false });
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should return failure when iconUrl is empty string', async () => {
        const result = await fetchIconDataAsBase64({
          iconUrl: '',
          fetcher: mockFetch,
        });

        expect(result).toEqual({ success: false });
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should return failure when fetch response is not ok', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        } as Response);

        const result = await fetchIconDataAsBase64({
          iconUrl: 'https://example.com/nonexistent.png',
          fetcher: mockFetch,
        });

        expect(result).toEqual({ success: false });
        expect(mockFetch).toHaveBeenCalledWith(
          'https://example.com/nonexistent.png',
        );
      });

      it('should return failure when fetch throws an error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await fetchIconDataAsBase64({
          iconUrl: 'https://example.com/icon.png',
          fetcher: mockFetch,
        });

        expect(result).toEqual({ success: false });
        expect(mockFetch).toHaveBeenCalledWith('https://example.com/icon.png');
      });

      it('should return failure when arrayBuffer() throws an error', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.reject(new Error('ArrayBuffer error')),
        } as Response);

        const result = await fetchIconDataAsBase64({
          iconUrl: 'https://example.com/icon.png',
          fetcher: mockFetch,
        });

        expect(result).toEqual({ success: false });
      });
    });

    describe('edge cases', () => {
      it('should handle empty response body', async () => {
        const emptyArrayBuffer = new ArrayBuffer(0);

        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(emptyArrayBuffer),
        } as Response);

        const result = await fetchIconDataAsBase64({
          iconUrl: 'https://example.com/empty.png',
          fetcher: mockFetch,
        });

        expect(result).toEqual({
          success: true,
          imageDataBase64: 'data:image/png;base64,',
        });
      });

      it('should handle very large image data', async () => {
        // Create a large mock image (1MB)
        const largeImageData = new Uint8Array(1024 * 1024).fill(255);
        const mockArrayBuffer = largeImageData.buffer;

        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockArrayBuffer),
        } as Response);

        const result = await fetchIconDataAsBase64({
          iconUrl: 'https://example.com/large-icon.png',
          fetcher: mockFetch,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.imageDataBase64).toMatch(/^data:image\/png;base64,/);
          expect(result.imageDataBase64.length).toBeGreaterThan(1000000);
        }
      });

      it('should handle special characters in URL', async () => {
        const mockArrayBuffer = new TextEncoder().encode('test').buffer;
        mockFetch.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockArrayBuffer),
        } as Response);

        const result = await fetchIconDataAsBase64({
          iconUrl: 'https://example.com/icon with spaces & symbols.png',
          fetcher: mockFetch,
        });

        expect(result.success).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://example.com/icon with spaces & symbols.png',
        );
      });
    });
  });

  describe('getIconData', () => {
    const createMockContext = (
      iconDataBase64: string | null,
      symbol: string = 'USDC',
    ): BaseTokenPermissionContext => ({
      expiry: '05/01/2024',
      isAdjustmentAllowed: true,
      justification: 'Test permission',
      accountDetails: {
        address: '0x1234567890123456789012345678901234567890' as Hex,
        balance: '0x1000000' as Hex,
        balanceFormattedAsCurrency: '$100.00',
      },
      tokenMetadata: {
        symbol,
        decimals: 6,
        iconDataBase64,
      },
    });

    describe('success cases', () => {
      it('should return IconData when iconDataBase64 is provided', () => {
        const mockIconUrl =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        const context = createMockContext(mockIconUrl, 'USDC');

        const result = getIconData(context);

        expect(result).toEqual({
          iconDataBase64: mockIconUrl,
          iconAltText: 'USDC',
        });
      });

      it('should use token symbol as alt text', () => {
        const mockIconUrl = 'data:image/png;base64,test';
        const context = createMockContext(mockIconUrl, 'ETH');

        const result = getIconData(context);

        expect(result).toEqual({
          iconDataBase64: mockIconUrl,
          iconAltText: 'ETH',
        });
      });

      it('should handle different icon formats', () => {
        const mockIconUrl = 'https://example.com/icon.svg';
        const context = createMockContext(mockIconUrl, 'DAI');

        const result = getIconData(context);

        expect(result).toEqual({
          iconDataBase64: mockIconUrl,
          iconAltText: 'DAI',
        });
      });
    });

    describe('failure cases', () => {
      it('should return undefined when iconDataBase64 is null', () => {
        const context = createMockContext(null);

        const result = getIconData(context);

        expect(result).toBeUndefined();
      });

      it('should return undefined when iconDataBase64 is empty string', () => {
        const context = createMockContext('');

        const result = getIconData(context);

        expect(result).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      it('should handle empty symbol', () => {
        const mockIconUrl = 'data:image/png;base64,test';
        const context = createMockContext(mockIconUrl, '');

        const result = getIconData(context);

        expect(result).toEqual({
          iconDataBase64: mockIconUrl,
          iconAltText: '',
        });
      });

      it('should handle symbol with special characters', () => {
        const mockIconUrl = 'data:image/png;base64,test';
        const context = createMockContext(mockIconUrl, 'USDC-ETH LP');

        const result = getIconData(context);

        expect(result).toEqual({
          iconDataBase64: mockIconUrl,
          iconAltText: 'USDC-ETH LP',
        });
      });

      it('should handle very long symbol', () => {
        const mockIconUrl = 'data:image/png;base64,test';
        const longSymbol = 'A'.repeat(100);
        const context = createMockContext(mockIconUrl, longSymbol);

        const result = getIconData(context);

        expect(result).toEqual({
          iconDataBase64: mockIconUrl,
          iconAltText: longSymbol,
        });
      });
    });
  });
});
