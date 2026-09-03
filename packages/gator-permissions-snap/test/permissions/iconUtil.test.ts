import { describe, expect, it } from '@jest/globals';
import type { CaipAssetType } from '@metamask/snaps-sdk';

import { getIconData } from '../../src/permissions/iconUtil';
import { createMockTokenMetadataCoordinator } from '../testContext';

const mockCaip19 =
  'eip155:1/erc20:0x1234567890123456789012345678901234567890' as CaipAssetType;

describe('iconUtil', () => {
  describe('getIconData', () => {
    it('returns IconData when iconDataBase64 is provided', () => {
      const mockIconUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGAWjR9awAAAABJRU5ErkJggg==';
      const coordinator = createMockTokenMetadataCoordinator({
        metadata: {
          symbol: 'USDC',
          decimals: 6,
          iconDataBase64: mockIconUrl,
        },
      });

      const result = getIconData(coordinator, mockCaip19);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: 'USDC',
      });
    });

    it('uses token symbol as alt text', () => {
      const mockIconUrl = 'data:image/png;base64,test';
      const coordinator = createMockTokenMetadataCoordinator({
        metadata: {
          symbol: 'ETH',
          decimals: 18,
          iconDataBase64: mockIconUrl,
        },
      });

      const result = getIconData(coordinator, mockCaip19);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: 'ETH',
      });
    });

    it('handles different icon formats', () => {
      const mockIconUrl = 'https://example.com/icon.svg';
      const coordinator = createMockTokenMetadataCoordinator({
        metadata: {
          symbol: 'DAI',
          decimals: 18,
          iconDataBase64: mockIconUrl,
        },
      });

      const result = getIconData(coordinator, mockCaip19);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: 'DAI',
      });
    });
    it('returns undefined when iconDataBase64 is null', () => {
      const coordinator = createMockTokenMetadataCoordinator({
        metadata: {
          symbol: 'USDC',
          decimals: 6,
          iconDataBase64: null,
        },
      });

      const result = getIconData(coordinator, mockCaip19);

      expect(result).toBeUndefined();
    });

    it('returns undefined when iconDataBase64 is empty string', () => {
      const coordinator = createMockTokenMetadataCoordinator({
        metadata: {
          symbol: 'USDC',
          decimals: 6,
          iconDataBase64: '',
        },
      });

      const result = getIconData(coordinator, mockCaip19);

      expect(result).toBeUndefined();
    });

    it('handles empty symbol', () => {
      const mockIconUrl = 'data:image/png;base64,test';
      const coordinator = createMockTokenMetadataCoordinator({
        metadata: {
          symbol: '',
          decimals: 6,
          iconDataBase64: mockIconUrl,
        },
      });

      const result = getIconData(coordinator, mockCaip19);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: '',
      });
    });

    it('handles symbol with special characters', () => {
      const mockIconUrl = 'data:image/png;base64,test';
      const coordinator = createMockTokenMetadataCoordinator({
        metadata: {
          symbol: 'USDC-ETH LP',
          decimals: 6,
          iconDataBase64: mockIconUrl,
        },
      });

      const result = getIconData(coordinator, mockCaip19);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: 'USDC-ETH LP',
      });
    });

    it('handles very long symbol', () => {
      const mockIconUrl = 'data:image/png;base64,test';
      const longSymbol = 'A'.repeat(100);
      const coordinator = createMockTokenMetadataCoordinator({
        metadata: {
          symbol: longSymbol,
          decimals: 6,
          iconDataBase64: mockIconUrl,
        },
      });

      const result = getIconData(coordinator, mockCaip19);

      expect(result).toStrictEqual({
        iconDataBase64: mockIconUrl,
        iconAltText: longSymbol,
      });
    });
  });
});
