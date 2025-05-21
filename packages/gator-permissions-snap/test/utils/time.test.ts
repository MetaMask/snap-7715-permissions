import {
  convertTimestampToReadableDate,
  convertReadableDateToTimestamp,
  isHumanReadableInCorrectFormat,
  getStartOfTodayUTC,
  getStartOfNextDayUTC,
} from '../../src/utils/time';

describe('Time Utility Functions', () => {
  describe('convertTimestampToReadableDate', () => {
    it('should convert a Unix timestamp to MM/DD/YYYY format', () => {
      const timestamp = 1747022400;
      expect(convertTimestampToReadableDate(timestamp)).toBe('05/12/2025');
    });

    it('should handle different dates correctly', () => {
      const timestamp = 1749700800;
      expect(convertTimestampToReadableDate(timestamp)).toBe('06/12/2025');
    });

    it('should throw an error for invalid date format', () => {
      const timestamp = NaN;
      expect(() => convertTimestampToReadableDate(timestamp)).toThrow(
        'Invalid date format',
      );
    });
  });

  describe('convertReadableDateToTimestamp', () => {
    it('should convert MM/DD/YYYY format to Unix timestamp', () => {
      const date = '04/11/2025';
      const expectedTimestamp = 1744329600;
      expect(convertReadableDateToTimestamp(date)).toBe(expectedTimestamp);
    });

    it('should handle different dates correctly', () => {
      const date = '04/12/2025';
      const expectedTimestamp = 1744416000;
      expect(convertReadableDateToTimestamp(date)).toBe(expectedTimestamp);
    });

    it('should throw an error for invalid date format', () => {
      const date = 'invalid-date';
      expect(() => convertReadableDateToTimestamp(date)).toThrow(
        'Invalid date format',
      );
    });
  });

  describe('isHumanReadableInCorrectFormat', () => {
    it('should return true for valid MM/DD/YYYY format', () => {
      expect(isHumanReadableInCorrectFormat('01/01/2023')).toBe(true);
      expect(isHumanReadableInCorrectFormat('12/10/2023')).toBe(true);
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
