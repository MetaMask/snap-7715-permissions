import {
  fromCaip10Address,
  toCaip10Address,
  fromCaip19Address,
} from '../../src/utils/address';
import type { CaipAssetType, Hex } from '@metamask/utils';
import { Caip10Address } from '../../src/core/types';
import { ZERO_ADDRESS } from '../../src/constants';

describe('address utils', () => {
  describe('fromCaip10Address', () => {
    it.each([
      [
        'eip155:1:0x1234567890123456789012345678901234567890',
        {
          chain: 'eip155',
          chainId: 1,
          address: '0x1234567890123456789012345678901234567890' as Hex,
        },
      ],
      [
        'eip155:10:0xabc',
        { chain: 'eip155', chainId: 10, address: '0xabc' as Hex },
      ],
    ])('parses valid CAIP-10 address "%s" to %o', (input, expected) => {
      expect(fromCaip10Address(input as Caip10Address)).toEqual(expected);
    });

    it.each(['bip:1:0x123', 'eip155:1', 'eip155', ':1:0x123'])(
      'throws error for invalid address "%s"',
      (input) => {
        expect(() => fromCaip10Address(input as Caip10Address)).toThrow(
          'Invalid address',
        );
      },
    );
  });

  describe('toCaip10Address', () => {
    it.each([
      [{ chainId: 1, address: '0x123' as Hex }, 'eip155:1:0x123'],
      [
        { chain: 'eip155', chainId: 10, address: '0xabc' as Hex },
        'eip155:10:0xabc',
      ],
      [{ chain: 'bip', chainId: 1, address: '0x123' as Hex }, 'bip:1:0x123'],
    ])('constructs CAIP-10 address from %o to "%s"', (input, expected) => {
      expect(toCaip10Address(input)).toBe(expected);
    });
  });

  describe('fromCaip19Address', () => {
    it.each([
      [
        'eip155:1/erc20:0xabc',
        {
          chain: 'eip155',
          chainId: 1,
          assetType: 'erc20',
          assetAddress: '0xabc' as Hex,
        },
      ],
      [
        'eip155:10/slip44:60',
        {
          chain: 'eip155',
          chainId: 10,
          assetType: 'slip44',
          assetAddress: ZERO_ADDRESS,
        },
      ],
    ])('parses valid CAIP-19 address "%s" to %o', (input, expected) => {
      expect(fromCaip19Address(input as CaipAssetType)).toEqual(expected);
    });

    it.each([
      'eip155:1/erc20',
      'bip:1/erc20:0xabc',
      'eip155:1',
      'eip155',
      '/erc20:0xabc',
    ])('throws error for invalid address "%s"', (input) => {
      expect(() => fromCaip19Address(input as CaipAssetType)).toThrow(
        'Invalid address',
      );
    });
  });
});
