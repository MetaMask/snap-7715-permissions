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
      const expectedTimestamp = 1744344000;
      expect(convertReadableDateToTimestamp(date)).toBe(expectedTimestamp);
    });

    it('should handle different dates correctly', () => {
      const date = '04/11/2025';
      const expectedTimestamp = 1744344000;
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
