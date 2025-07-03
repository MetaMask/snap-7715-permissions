import {
  formatUnits,
  formatUnitsFromHex,
  parseUnits,
} from '../../src/utils/value';

describe('value utils', () => {
  const testCases: [bigint, number, string][] = [
    [123456789n, 6, '123.456789'],
    [10000000n, 6, '10'],
    [1000000n, 6, '1'],
    [100000n, 6, '0.1'],
    [10000n, 6, '0.01'],
    [1000n, 6, '0.001'],
    [100n, 6, '0.0001'],
    [10n, 6, '0.00001'],
    [1n, 6, '0.000001'],
    [1000001n, 6, '1.000001'],
  ];

  describe('formatUnits', () => {
    it.each(testCases)(
      'formats %sn with %d decimals to "%s"',
      (value, decimals, formatted) => {
        expect(formatUnits({ value, decimals })).toBe(formatted);
      },
    );
  });

  describe('parseUnits', () => {
    it.each(testCases)(
      'parses human-readable string "%s" with %d decimals to %sn',
      (value, decimals, formatted) => {
        expect(parseUnits({ formatted, decimals })).toBe(value);
      },
    );

    it('parses human-readable string with leading 0', () => {
      expect(parseUnits({ formatted: '0000001', decimals: 6 })).toBe(1000000n);
    });

    it('throws an error for invalid numeric values', () => {
      expect(() => parseUnits({ formatted: 'abc', decimals: 6 })).toThrow(
        'Invalid numeric value: abc',
      );
    });
  });

  describe('formatUnitsFromHex', () => {
    it.each(testCases)(
      'formats a hex value to a human-readable string',
      (value, decimals, formatted) => {
        const hexValue = `0x${value.toString(16)}` as const;

        expect(
          formatUnitsFromHex({
            value: hexValue,
            allowUndefined: false,
            decimals,
          }),
        ).toBe(formatted);
      },
    );
  });
});
