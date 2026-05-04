import { describe, it, expect } from '@jest/globals';
import type { Hex } from '@metamask/delegation-core';

import {
  validateHexInteger,
  validatePayeeRule,
  validateRedeemerRule,
} from '../../src/permissions/validation';

describe('validateHexInteger', () => {
  describe('valid cases', () => {
    it('should pass for valid hex integers', () => {
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: '0x1' as Hex,
          allowZero: false,
          required: true,
        }),
      ).not.toThrow();

      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: '0xFF' as Hex,
          allowZero: false,
          required: true,
        }),
      ).not.toThrow();

      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: '0x123456789ABCDEF' as Hex,
          allowZero: false,
          required: true,
        }),
      ).not.toThrow();
    });

    it('should pass for zero values when allowZero is true', () => {
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: '0x0' as Hex,
          allowZero: true,
          required: true,
        }),
      ).not.toThrow();
    });

    it('should pass for undefined values when not required', () => {
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: undefined,
          allowZero: false,
          required: false,
        }),
      ).not.toThrow();

      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: undefined,
          allowZero: true,
          required: false,
        }),
      ).not.toThrow();
    });
  });

  describe('required validation', () => {
    it('should throw error when value is undefined and required is true', () => {
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: undefined,
          allowZero: false,
          required: true,
        }),
      ).toThrow('Invalid testValue: must be defined');
    });

    it('should throw error when value is null and required is true', () => {
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: null as any,
          allowZero: false,
          required: true,
        }),
      ).toThrow('Invalid testValue: must be defined');
    });

    it('should use the provided name in error messages', () => {
      expect(() =>
        validateHexInteger({
          name: 'customFieldName',
          value: undefined,
          allowZero: false,
          required: true,
        }),
      ).toThrow('Invalid customFieldName: must be defined');
    });
  });

  describe('hex format validation', () => {
    it('should throw error for invalid hex strings', () => {
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: 'invalid' as Hex,
          allowZero: false,
          required: true,
        }),
      ).toThrow('Invalid testValue: must be a valid hex integer');

      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: '0xGG' as Hex,
          allowZero: false,
          required: true,
        }),
      ).toThrow('Invalid testValue: must be a valid hex integer');

      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: 'notahex' as Hex,
          allowZero: false,
          required: true,
        }),
      ).toThrow('Invalid testValue: must be a valid hex integer');
    });
  });

  describe('zero value validation', () => {
    it('should throw error for zero values when allowZero is false', () => {
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: '0x0' as Hex,
          allowZero: false,
          required: true,
        }),
      ).toThrow('Invalid testValue: must be greater than 0');

      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: '0x00' as Hex,
          allowZero: false,
          required: true,
        }),
      ).toThrow('Invalid testValue: must be greater than 0');
    });

    it('should accept zero values when allowZero is true', () => {
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: '0x0' as Hex,
          allowZero: true,
          required: true,
        }),
      ).not.toThrow();

      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: '0x00' as Hex,
          allowZero: true,
          required: true,
        }),
      ).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle large hex values', () => {
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value:
            '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF' as Hex,
          allowZero: false,
          required: true,
        }),
      ).not.toThrow();
    });

    it('should handle hex values without 0x prefix if BigInt can parse them', () => {
      // Note: This test depends on how BigInt handles strings without 0x prefix
      // BigInt('1') should work, but BigInt('FF') might not work as hex
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: '1' as Hex,
          allowZero: false,
          required: true,
        }),
      ).not.toThrow();
    });

    it('should handle different parameter combinations', () => {
      // Non-required, allowZero false, undefined value
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: undefined,
          allowZero: false,
          required: false,
        }),
      ).not.toThrow();

      // Non-required, allowZero true, undefined value
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: undefined,
          allowZero: true,
          required: false,
        }),
      ).not.toThrow();

      // Required, allowZero true, valid non-zero value
      expect(() =>
        validateHexInteger({
          name: 'testValue',
          value: '0x1' as Hex,
          allowZero: true,
          required: true,
        }),
      ).not.toThrow();
    });
  });
});

describe('validateRedeemerRule', () => {
  it('does nothing when no redeemer rule exists', () => {
    expect(() =>
      validateRedeemerRule([{ type: 'expiry', data: { timestamp: 999 } }]),
    ).not.toThrow();
  });

  it('does nothing when rules is undefined', () => {
    expect(() => validateRedeemerRule(undefined)).not.toThrow();
  });

  it('passes for redeemer rule with valid addresses', () => {
    expect(() =>
      validateRedeemerRule([
        {
          type: 'redeemer',
          data: {
            addresses: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
          },
        },
      ]),
    ).not.toThrow();
  });

  it('throws for redeemer rule with empty addresses', () => {
    expect(() =>
      validateRedeemerRule([{ type: 'redeemer', data: { addresses: [] } }]),
    ).toThrow(
      'Invalid redeemer rule: must include a non-empty addresses array',
    );
  });
});

describe('validatePayeeRule', () => {
  it('does nothing when no payee rule exists', () => {
    expect(() =>
      validatePayeeRule([{ type: 'expiry', data: { timestamp: 999 } }]),
    ).not.toThrow();
  });

  it('does nothing when rules is undefined', () => {
    expect(() => validatePayeeRule(undefined)).not.toThrow();
  });

  it('passes for payee rule with valid addresses', () => {
    expect(() =>
      validatePayeeRule([
        {
          type: 'payee',
          data: {
            addresses: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
          },
        },
      ]),
    ).not.toThrow();
  });

  it('throws for payee rule with empty addresses', () => {
    expect(() =>
      validatePayeeRule([{ type: 'payee', data: { addresses: [] } }]),
    ).toThrow('Invalid payee rule: must include a non-empty addresses array');
  });
});
