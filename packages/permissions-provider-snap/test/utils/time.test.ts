import {
  convertTimestampToReadableDate,
  convertReadableDateToTimestamp,
  isHumanReadableInCorrectFormat,
  getStartOfToday,
  getStartOfNextDay,
} from '../../src/utils/time';

describe('Time Utility Functions', () => {
  describe('convertTimestampToReadableDate', () => {
    it('should convert a Unix timestamp to MM/DD/YYYY format', () => {
      const timestamp = 1672531200;
      expect(convertTimestampToReadableDate(timestamp)).toBe('12/31/2022');
    });

    it('should handle different dates correctly', () => {
      const timestamp = 1704067200;
      expect(convertTimestampToReadableDate(timestamp)).toBe('12/31/2023');
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
      const date = '01/01/2023';
      const expectedTimestamp = 1672549200;
      expect(convertReadableDateToTimestamp(date)).toBe(expectedTimestamp);
    });

    it('should handle different dates correctly', () => {
      const date = '12/31/2023';
      const expectedTimestamp = 1703998800;
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
      expect(isHumanReadableInCorrectFormat('12/31/2023')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isHumanReadableInCorrectFormat('invalid-date')).toBe(false);
      expect(isHumanReadableInCorrectFormat('01-01-2023')).toBe(false);
      expect(isHumanReadableInCorrectFormat('')).toBe(false);
    });
  });

  describe('getStartOfToday', () => {
    it('should return the Unix timestamp for the start of today', () => {
      const now = new Date();
      const expectedStartOfToday = new Date(now.setHours(0, 0, 0, 0));
      const expectedTimestamp = Math.floor(
        expectedStartOfToday.getTime() / 1000,
      );

      expect(getStartOfToday()).toBe(expectedTimestamp);
    });
  });

  describe('getStartOfNextDay', () => {
    it('should return the Unix timestamp for the start of the next day', () => {
      const now = new Date();
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const startOfTomorrow = new Date(
        startOfToday.getTime() + 24 * 60 * 60 * 1000,
      );
      const expectedTimestamp = Math.floor(startOfTomorrow.getTime() / 1000);

      expect(getStartOfNextDay()).toBe(expectedTimestamp);
    });

    it('should be exactly 24 hours after the start of today', () => {
      const startOfToday = getStartOfToday();
      const startOfNextDay = getStartOfNextDay();
      expect(startOfNextDay - startOfToday).toBe(24 * 60 * 60);
    });
  });
});
