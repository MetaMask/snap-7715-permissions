import { formatAsCurrency, type Preferences } from '../../src/utils/locale';

describe('formatAsCurrency', () => {
  describe('USD', () => {
    const preferences: Preferences = {
      locale: 'en',
      currency: 'USD',
    };
    it('should format the number as currency with two decimal places by default', () => {
      const value = 1234.567;
      const result = formatAsCurrency(preferences, value);

      expect(result).toBe('$1,234.57'); // The expected output for USD with 2 decimal places
    });

    it('should format the number with the specified number of decimal places', () => {
      const value = 1234.567;
      const result = formatAsCurrency(preferences, value, 1);

      expect(result).toBe('$1,234.6'); // The expected output with 1 decimal place
    });

    it('should handle zero value correctly', () => {
      const value = 0;
      const result = formatAsCurrency(preferences, value);

      expect(result).toBe('$0.00'); // The expected output for $0.00 in USD
    });

    it('should format negative values correctly', () => {
      const value = -1234.56;
      const result = formatAsCurrency(preferences, value);

      expect(result).toBe('-$1,234.56'); // The expected output for negative values
    });
  });
});
