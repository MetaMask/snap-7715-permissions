import { describe, expect, it } from '@jest/globals';
import type { Hex } from '@metamask/delegation-core';

import type { BaseContext } from '../../src/core/types';
import { getIconData } from '../../src/permissions/iconUtil';

describe('iconUtil', () => {
  describe('getIconData', () => {
    const createMockContext = (
      iconDataBase64: string | null,
      symbol = 'USDC',
    ): BaseContext => ({
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

    it('returns IconData when iconDataBase64 is provided', () => {
      const mockIconUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const context = createMockContext(mockIconUrl, 'USDC');

      const result = getIconData(context);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: 'USDC',
      });
    });

    it('uses token symbol as alt text', () => {
      const mockIconUrl = 'data:image/png;base64,test';
      const context = createMockContext(mockIconUrl, 'ETH');

      const result = getIconData(context);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: 'ETH',
      });
    });

    it('handles different icon formats', () => {
      const mockIconUrl = 'https://example.com/icon.svg';
      const context = createMockContext(mockIconUrl, 'DAI');

      const result = getIconData(context);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: 'DAI',
      });
    });
    it('returns undefined when iconDataBase64 is null', () => {
      const context = createMockContext(null);

      const result = getIconData(context);

      expect(result).toBeUndefined();
    });

    it('returns undefined when iconDataBase64 is empty string', () => {
      const context = createMockContext('');

      const result = getIconData(context);

      expect(result).toBeUndefined();
    });

    it('handles empty symbol', () => {
      const mockIconUrl = 'data:image/png;base64,test';
      const context = createMockContext(mockIconUrl, '');

      const result = getIconData(context);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: '',
      });
    });

    it('handles symbol with special characters', () => {
      const mockIconUrl = 'data:image/png;base64,test';
      const context = createMockContext(mockIconUrl, 'USDC-ETH LP');

      const result = getIconData(context);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: 'USDC-ETH LP',
      });
    });

    it('handles very long symbol', () => {
      const mockIconUrl = 'data:image/png;base64,test';
      const longSymbol = 'A'.repeat(100);
      const context = createMockContext(mockIconUrl, longSymbol);

      const result = getIconData(context);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: longSymbol,
      });
    });
  });
});
