import {
  convertTimestampToReadableDate,
  convertReadableDateToTimestamp,
  isHumanReadableInCorrectFormat,
  getStartOfTodayUTC,
  getStartOfNextDayUTC,
} from '../../src/utils/time';

describe('Time Utility Functions', () => {
  describe('convertTimestampToReadableDate', () => {
    it('should convert a Unix timestamp to locale-appropriate format', () => {
      const timestamp = 1747022400;
      const result = convertTimestampToReadableDate(timestamp);
      // The result should be a valid date string, but the exact format depends on locale
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Verify it contains numbers and separators typical of date formats
      expect(result).toMatch(/[\d\/\-\.]/);
    });

    it('should handle different dates correctly', () => {
      const timestamp = 1749700800;
      const result = convertTimestampToReadableDate(timestamp);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toMatch(/[\d\/\-\.]/);
    });

    it('should throw an error for invalid date format', () => {
      const timestamp = NaN;
      expect(() => convertTimestampToReadableDate(timestamp)).toThrow(
        'Invalid date format',
      );
    });
  });

  describe('convertReadableDateToTimestamp', () => {
    it('should convert MM/DD/YYYY format to Unix timestamp (backward compatibility)', () => {
      const date = '04/11/2025';
      const expectedTimestamp = 1744329600;
      expect(convertReadableDateToTimestamp(date)).toBe(expectedTimestamp);
    });

    it('should handle different dates correctly', () => {
      const date = '04/12/2025';
      const expectedTimestamp = 1744416000;
      expect(convertReadableDateToTimestamp(date)).toBe(expectedTimestamp);
    });

    it('should handle locale-specific date formats', () => {
      // Test that it can handle various date formats
      const date1 = '2025-04-11'; // ISO format
      const date2 = '11/04/2025'; // DD/MM/YYYY format
      
      // Both should produce valid timestamps
      expect(() => convertReadableDateToTimestamp(date1)).not.toThrow();
      expect(() => convertReadableDateToTimestamp(date2)).not.toThrow();
      
      const timestamp1 = convertReadableDateToTimestamp(date1);
      const timestamp2 = convertReadableDateToTimestamp(date2);
      
      expect(typeof timestamp1).toBe('number');
      expect(typeof timestamp2).toBe('number');
      expect(timestamp1).toBeGreaterThan(0);
      expect(timestamp2).toBeGreaterThan(0);
    });

    it('should throw an error for invalid date format', () => {
      const date = 'invalid-date';
      expect(() => convertReadableDateToTimestamp(date)).toThrow(
        'Invalid date format',
      );
    });

    it('should handle inputs that are already timestamps', () => {
      const timestamp = '1744329600'; // April 11, 2025 timestamp
      expect(convertReadableDateToTimestamp(timestamp)).toBe(1744329600);
      
      const anotherTimestamp = '1640995200'; // January 1, 2022 timestamp
      expect(convertReadableDateToTimestamp(anotherTimestamp)).toBe(1640995200);
    });

    it('should reject non-integer numeric strings', () => {
      const decimalString = '1744329600.5';
      expect(() => convertReadableDateToTimestamp(decimalString)).toThrow(
        'Invalid date format',
      );
    });
  });

  describe('isHumanReadableInCorrectFormat', () => {
    it('should return true for valid MM/DD/YYYY format (backward compatibility)', () => {
      expect(isHumanReadableInCorrectFormat('01/01/2023')).toBe(true);
      expect(isHumanReadableInCorrectFormat('12/10/2023')).toBe(true);
    });

    it('should return true for valid locale-specific formats', () => {
      expect(isHumanReadableInCorrectFormat('2023-01-01')).toBe(true); // ISO format
      expect(isHumanReadableInCorrectFormat('01/01/2023')).toBe(true); // MM/DD/YYYY
      expect(isHumanReadableInCorrectFormat('1/1/2023')).toBe(true); // M/D/YYYY
    });

    it('should return false for invalid formats', () => {
      expect(isHumanReadableInCorrectFormat('invalid-date')).toBe(false);
      expect(isHumanReadableInCorrectFormat('01-07-2023')).toBe(false);
      expect(isHumanReadableInCorrectFormat('')).toBe(false);
    });
  });

  describe('getStartOfTodayUTC', () => {
    beforeEach(() => {
      // Set a fixed date (May 12, 2025 00:00:00 UTC)
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-05-12T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return the Unix timestamp for the start of today', () => {
      const expectedTimestamp = 1747008000; // May 12, 2025 00:00:00 UTC
      expect(getStartOfTodayUTC()).toBe(expectedTimestamp);
    });
  });

  describe('getStartOfNextDayUTC', () => {
    beforeEach(() => {
      // Set a fixed date (May 12, 2025 00:00:00 UTC)
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-05-12T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return the Unix timestamp for the start of the next day', () => {
      const expectedTimestamp = 1747094400; // May 13, 2025 00:00:00 UTC
      expect(getStartOfNextDayUTC()).toBe(expectedTimestamp);
    });

    it('should be exactly 24 hours after the start of today', () => {
      const startOfToday = getStartOfTodayUTC();
      const startOfNextDay = getStartOfNextDayUTC();
      expect(startOfNextDay - startOfToday).toBe(24 * 60 * 60);
    });
  });
});
