import { describe, expect, it } from '@jest/globals';

import {
  formatSelectorForDisplay,
  isFourByteSelector,
  isFunctionSignature,
  normalizeSelector,
  toFourByteSelector,
} from '../../../src/permissions/erc20TokenSwap/selectors';

describe('erc20TokenSwap:selectors', () => {
  describe('isFourByteSelector()', () => {
    it('accepts 4-byte hex selectors', () => {
      expect(isFourByteSelector('0xa9059cbb')).toBe(true);
      expect(isFourByteSelector('0xA9059CBB')).toBe(true);
    });

    it('rejects other strings', () => {
      expect(isFourByteSelector('0xa9059cb')).toBe(false);
      expect(isFourByteSelector('0xa9059cbb00')).toBe(false);
      expect(isFourByteSelector('transfer(address,uint256)')).toBe(false);
    });
  });

  describe('isFunctionSignature()', () => {
    it('accepts ABI function signatures', () => {
      expect(isFunctionSignature('transfer(address,uint256)')).toBe(true);
      expect(isFunctionSignature('exit()')).toBe(true);
      expect(
        isFunctionSignature(
          'removeLiquiditySingleToken(address,address,uint256,(address,uint256,address,address,(uint8,address,bytes,bool)),(address,bytes,bytes))',
        ),
      ).toBe(true);
    });

    it('rejects other strings', () => {
      expect(isFunctionSignature('transfer')).toBe(false);
      expect(isFunctionSignature('0xa9059cbb')).toBe(false);
      expect(isFunctionSignature('1abc()')).toBe(false);
    });
  });

  describe('normalizeSelector()', () => {
    it('lowercases hex selectors', () => {
      expect(normalizeSelector('0xA9059CBB')).toBe('0xa9059cbb');
    });

    it('strips whitespace from signatures', () => {
      expect(normalizeSelector('transfer(address, uint256)')).toBe(
        'transfer(address,uint256)',
      );
    });
  });

  describe('toFourByteSelector()', () => {
    it('returns hex selectors lowercased', () => {
      expect(toFourByteSelector('0xA9059CBB')).toBe('0xa9059cbb');
    });

    it('hashes function signatures to their selector', () => {
      expect(toFourByteSelector('transfer(address,uint256)')).toBe(
        '0xa9059cbb',
      );
      expect(toFourByteSelector('approve(address, uint256)')).toBe(
        '0x095ea7b3',
      );
    });

    it('throws for invalid entries', () => {
      expect(() => toFourByteSelector('not a selector')).toThrow(
        'Invalid selector',
      );
    });
  });

  describe('formatSelectorForDisplay()', () => {
    it('reduces signatures to the function name', () => {
      expect(formatSelectorForDisplay('transfer(address,uint256)')).toBe(
        'transfer()',
      );
    });

    it('leaves hex selectors unchanged', () => {
      expect(formatSelectorForDisplay('0xa9059cbb')).toBe('0xa9059cbb');
    });
  });
});
