import {
  convertTimestampToReadableDate,
  convertReadableDateToTimestamp,
  getStartOfTodayUTC,
  getStartOfNextDayUTC,
} from '../../src/utils/time';

describe('Time Utility Functions', () => {
  describe('convertTimestampToReadableDate', () => {
    it('should convert a Unix timestamp to mm/dd/yyyy format', () => {
      const timestamp = 1744588800; // April 14, 2025
      const result = convertTimestampToReadableDate(timestamp);
      expect(result).toBe('04/14/2025');
    });

    it('should handle different dates correctly', () => {
      const timestamp = 1747180800; // May 14, 2025
      const result = convertTimestampToReadableDate(timestamp);
      expect(result).toBe('05/14/2025');
    });

    it('should throw an error for invalid date format', () => {
      const timestamp = NaN;
      expect(() => convertTimestampToReadableDate(timestamp)).toThrow(
        'Invalid date format',
      );
    });
  });

  describe('convertReadableDateToTimestamp', () => {
    it('should convert mm/dd/yyyy format to Unix timestamp (backward compatibility)', () => {
      const date = '04/11/2025';
      const expectedTimestamp = 1744329600;
      expect(convertReadableDateToTimestamp(date)).toBe(expectedTimestamp);
    });

    it('should handle different dates correctly', () => {
      const date = '04/12/2025';
      const expectedTimestamp = 1744416000;
      expect(convertReadableDateToTimestamp(date)).toBe(expectedTimestamp);
    });

    it('should reject non-mm/dd/yyyy formats', () => {
      // Test that it rejects various non-mm/dd/yyyy formats
      const date1 = '2025-04-11'; // ISO format
      const date2 = '04-11-2025'; // MM-DD-YYYY format with dashes
      
      // Both should throw errors
      expect(() => convertReadableDateToTimestamp(date1)).toThrow('Invalid date format. Expected format: mm/dd/yyyy');
      expect(() => convertReadableDateToTimestamp(date2)).toThrow('Invalid date format. Expected format: mm/dd/yyyy');
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
