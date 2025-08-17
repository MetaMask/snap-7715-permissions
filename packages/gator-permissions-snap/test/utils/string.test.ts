import { truncateDecimalPlaces } from '../../src/utils/string';

describe('truncateDecimalPlaces', () => {
  it('truncates decimals to default 8 places', () => {
    expect(truncateDecimalPlaces('123.456789123')).toBe('123.45678912');
  });

  it('truncates decimals to specified places', () => {
    expect(truncateDecimalPlaces('123.456789123', 4)).toBe('123.4567');
  });

  it('returns original if decimals are less than or equal to specified', () => {
    expect(truncateDecimalPlaces('123.45', 8)).toBe('123.45');
    expect(truncateDecimalPlaces('123.4567', 4)).toBe('123.4567');
  });

  it('returns integer part if no decimals', () => {
    expect(truncateDecimalPlaces('100')).toBe('100');
  });

  it('trims input before processing', () => {
    expect(truncateDecimalPlaces('  123.456789123  ', 3)).toBe('123.456');
  });

  it('handles negative numbers', () => {
    expect(truncateDecimalPlaces('-123.456789', 2)).toBe('-123.45');
  });

  it('handles positive sign', () => {
    expect(truncateDecimalPlaces('+123.456789', 2)).toBe('123.45');
  });

  it('throws error for invalid input', () => {
    expect(() => truncateDecimalPlaces('abc.def')).toThrow(
      'Invalid number: abc.def',
    );
    expect(() => truncateDecimalPlaces('foo')).toThrow('Invalid number: foo');
    expect(() => truncateDecimalPlaces('')).toThrow('Invalid number: ');
  });

  it('handles scientific notation', () => {
    expect(truncateDecimalPlaces('1e-8')).toBe('0.00000001');
    expect(truncateDecimalPlaces('1.23e2')).toBe('123.00000000');
  });

  it('throws error for more than one dot', () => {
    expect(() => truncateDecimalPlaces('1.2.3')).toThrow(
      'Invalid number: 1.2.3',
    );
  });
});
