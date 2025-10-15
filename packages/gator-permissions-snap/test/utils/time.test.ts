import { TimePeriod } from '../../src/core/types';
import {
  convertTimestampToReadableDate,
  convertReadableDateToTimestamp,
  getStartOfTodayUTC,
  getStartOfNextDayUTC,
  getClosestTimePeriod,
  TIME_PERIOD_TO_SECONDS,
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
      // Calculate expected timestamp based on local timezone
      const localDate = new Date('2025-04-11T00:00:00');
      const expectedTimestamp = Math.floor(localDate.getTime() / 1000);
      expect(convertReadableDateToTimestamp(date)).toBe(expectedTimestamp);
    });

    it('should handle different dates correctly', () => {
      const date = '04/12/2025';
      // Calculate expected timestamp based on local timezone
      const localDate = new Date('2025-04-12T00:00:00');
      const expectedTimestamp = Math.floor(localDate.getTime() / 1000);
      expect(convertReadableDateToTimestamp(date)).toBe(expectedTimestamp);
    });

    it('should reject non-mm/dd/yyyy formats', () => {
      // Test that it rejects various non-mm/dd/yyyy formats
      const date1 = '2025-04-11'; // ISO format
      const date2 = '04-11-2025'; // MM-DD-YYYY format with dashes

      // Both should throw errors
      expect(() => convertReadableDateToTimestamp(date1)).toThrow(
        'Invalid date format. Expected format: mm/dd/yyyy',
      );
      expect(() => convertReadableDateToTimestamp(date2)).toThrow(
        'Invalid date format. Expected format: mm/dd/yyyy',
      );
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

  describe('getClosestTimePeriod', () => {
    it('should return HOURLY for exactly 1 hour', () => {
      const oneHour = TIME_PERIOD_TO_SECONDS[TimePeriod.HOURLY];
      expect(getClosestTimePeriod(oneHour)).toBe(TimePeriod.HOURLY);
    });

    it('should return DAILY for exactly 1 day', () => {
      const oneDay = TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY];
      expect(getClosestTimePeriod(oneDay)).toBe(TimePeriod.DAILY);
    });

    it('should return WEEKLY for exactly 1 week', () => {
      const oneWeek = TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY];
      expect(getClosestTimePeriod(oneWeek)).toBe(TimePeriod.WEEKLY);
    });

    it('should return BIWEEKLY for exactly 2 weeks', () => {
      const twoWeeks = TIME_PERIOD_TO_SECONDS[TimePeriod.BIWEEKLY];
      expect(getClosestTimePeriod(twoWeeks)).toBe(TimePeriod.BIWEEKLY);
    });

    it('should return MONTHLY for exactly 30 days', () => {
      const oneMonth = TIME_PERIOD_TO_SECONDS[TimePeriod.MONTHLY];
      expect(getClosestTimePeriod(oneMonth)).toBe(TimePeriod.MONTHLY);
    });

    it('should return YEARLY for exactly 365 days', () => {
      const oneYear = TIME_PERIOD_TO_SECONDS[TimePeriod.YEARLY];
      expect(getClosestTimePeriod(oneYear)).toBe(TimePeriod.YEARLY);
    });

    it('should return HOURLY for values closer to 1 hour', () => {
      expect(getClosestTimePeriod(3000n)).toBe(TimePeriod.HOURLY); // ~50 minutes
      expect(getClosestTimePeriod(4000n)).toBe(TimePeriod.HOURLY); // ~66 minutes
    });

    it('should return DAILY for values closer to 1 day', () => {
      expect(getClosestTimePeriod(80000n)).toBe(TimePeriod.DAILY); // ~22 hours
      expect(getClosestTimePeriod(90000n)).toBe(TimePeriod.DAILY); // ~25 hours
    });

    it('should return WEEKLY for values closer to 1 week', () => {
      expect(getClosestTimePeriod(500000n)).toBe(TimePeriod.WEEKLY); // ~5.8 days
      expect(getClosestTimePeriod(700000n)).toBe(TimePeriod.WEEKLY); // ~8.1 days
    });

    it('should return BIWEEKLY for values closer to 2 weeks', () => {
      expect(getClosestTimePeriod(1100000n)).toBe(TimePeriod.BIWEEKLY); // ~12.7 days
      expect(getClosestTimePeriod(1300000n)).toBe(TimePeriod.BIWEEKLY); // ~15 days
    });

    it('should return MONTHLY for values closer to 30 days', () => {
      expect(getClosestTimePeriod(2000000n)).toBe(TimePeriod.MONTHLY); // ~23 days
      expect(getClosestTimePeriod(2800000n)).toBe(TimePeriod.MONTHLY); // ~32 days
    });

    it('should return YEARLY for values closer to 365 days', () => {
      expect(getClosestTimePeriod(20000000n)).toBe(TimePeriod.YEARLY); // ~231 days
      expect(getClosestTimePeriod(40000000n)).toBe(TimePeriod.YEARLY); // ~463 days
    });

    it('should handle very small values', () => {
      expect(getClosestTimePeriod(1n)).toBe(TimePeriod.HOURLY); // Closest to hourly
      expect(getClosestTimePeriod(100n)).toBe(TimePeriod.HOURLY);
    });

    it('should handle very large values', () => {
      expect(getClosestTimePeriod(50000000n)).toBe(TimePeriod.YEARLY); // ~578 days
      expect(getClosestTimePeriod(100000000n)).toBe(TimePeriod.YEARLY); // ~1157 days
    });

    it('should handle boundary cases between periods', () => {
      // Exactly halfway between HOURLY (3,600) and DAILY (86,400)
      const halfwayHourlyDaily = (3600n + 86400n) / 2n; // 45,000
      const result = getClosestTimePeriod(halfwayHourlyDaily);
      expect([TimePeriod.HOURLY, TimePeriod.DAILY]).toContain(result);
    });

    it('should throw error for zero duration', () => {
      expect(() => getClosestTimePeriod(0n)).toThrow(
        'Period duration must be positive. Received: 0 seconds.',
      );
    });

    it('should throw error for negative duration', () => {
      expect(() => getClosestTimePeriod(-86400n)).toThrow(
        'Period duration must be positive. Received: -86400 seconds.',
      );
    });

    it('should throw error for absurdly large values (> 10 years)', () => {
      const elevenYears = 60n * 60n * 24n * 365n * 11n;
      expect(() => getClosestTimePeriod(elevenYears)).toThrow(
        'is too large. Maximum supported period is 10 years.',
      );
    });

    it('should accept values up to 10 years', () => {
      const tenYears = 60n * 60n * 24n * 365n * 10n;
      expect(() => getClosestTimePeriod(tenYears)).not.toThrow();
      expect(getClosestTimePeriod(tenYears)).toBe(TimePeriod.YEARLY);
    });
  });
});
