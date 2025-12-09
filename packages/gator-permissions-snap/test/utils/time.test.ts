import { TimePeriod } from '../../src/core/types';
import {
  getStartOfTodayUTC,
  getStartOfNextDayUTC,
  getClosestTimePeriod,
  TIME_PERIOD_TO_SECONDS,
  timestampToISO8601,
  iso8601ToTimestamp,
} from '../../src/utils/time';

describe('Time Utility Functions', () => {
  describe('timestampToISO8601', () => {
    it('should convert a Unix timestamp to ISO 8601 format', () => {
      const timestamp = 1704067200; // 2024-01-01T00:00:00.000Z
      const result = timestampToISO8601(timestamp);
      expect(result).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle timestamps with time components', () => {
      const timestamp = 1704106230; // 2024-01-01T10:50:30.000Z
      const result = timestampToISO8601(timestamp);
      expect(result).toBe('2024-01-01T10:50:30.000Z');
    });

    it('should throw an error for invalid timestamps', () => {
      expect(() => timestampToISO8601(NaN)).toThrow(
        'timestampToISO8601: Invalid timestamp',
      );
    });

    it('should handle zero timestamp (Unix epoch)', () => {
      const result = timestampToISO8601(0);
      expect(result).toBe('1970-01-01T00:00:00.000Z');
    });
  });

  describe('iso8601ToTimestamp', () => {
    it('should convert an ISO 8601 string to Unix timestamp', () => {
      const iso = '2024-01-01T00:00:00.000Z';
      const result = iso8601ToTimestamp(iso);
      expect(result).toBe(1704067200);
    });

    it('should handle ISO strings with time components', () => {
      const iso = '2024-01-01T10:50:30.000Z';
      const result = iso8601ToTimestamp(iso);
      expect(result).toBe(1704106230);
    });

    it('should handle ISO strings with timezone offset', () => {
      // +02:00 offset means 2 hours behind UTC
      const iso = '2024-01-01T02:00:00.000+02:00';
      const result = iso8601ToTimestamp(iso);
      expect(result).toBe(1704067200); // Same as 2024-01-01T00:00:00.000Z
    });

    it('should throw an error for invalid ISO strings', () => {
      expect(() => iso8601ToTimestamp('invalid-date')).toThrow(
        'iso8601ToTimestamp: Invalid ISO 8601 string',
      );
      expect(() => iso8601ToTimestamp('')).toThrow(
        'iso8601ToTimestamp: Invalid ISO 8601 string',
      );
    });
  });

  describe('timestampToISO8601 and iso8601ToTimestamp round-trip', () => {
    it('should round-trip correctly', () => {
      const originalTimestamp = 1704106230;
      const iso = timestampToISO8601(originalTimestamp);
      const result = iso8601ToTimestamp(iso);
      expect(result).toBe(originalTimestamp);
    });

    it('should round-trip correctly for various timestamps', () => {
      const testTimestamps = [
        0, // Unix epoch
        1704067200, // 2024-01-01
        1735689600, // 2025-01-01
        1893456000, // 2030-01-01
      ];

      for (const timestamp of testTimestamps) {
        const iso = timestampToISO8601(timestamp);
        const result = iso8601ToTimestamp(iso);
        expect(result).toBe(timestamp);
      }
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
      const oneHour = Number(TIME_PERIOD_TO_SECONDS[TimePeriod.HOURLY]);
      expect(getClosestTimePeriod(oneHour)).toBe(TimePeriod.HOURLY);
    });

    it('should return DAILY for exactly 1 day', () => {
      const oneDay = Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]);
      expect(getClosestTimePeriod(oneDay)).toBe(TimePeriod.DAILY);
    });

    it('should return WEEKLY for exactly 1 week', () => {
      const oneWeek = Number(TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY]);
      expect(getClosestTimePeriod(oneWeek)).toBe(TimePeriod.WEEKLY);
    });

    it('should return BIWEEKLY for exactly 2 weeks', () => {
      const twoWeeks = Number(TIME_PERIOD_TO_SECONDS[TimePeriod.BIWEEKLY]);
      expect(getClosestTimePeriod(twoWeeks)).toBe(TimePeriod.BIWEEKLY);
    });

    it('should return MONTHLY for exactly 30 days', () => {
      const oneMonth = Number(TIME_PERIOD_TO_SECONDS[TimePeriod.MONTHLY]);
      expect(getClosestTimePeriod(oneMonth)).toBe(TimePeriod.MONTHLY);
    });

    it('should return YEARLY for exactly 365 days', () => {
      const oneYear = Number(TIME_PERIOD_TO_SECONDS[TimePeriod.YEARLY]);
      expect(getClosestTimePeriod(oneYear)).toBe(TimePeriod.YEARLY);
    });

    it('should return HOURLY for values closer to 1 hour', () => {
      expect(getClosestTimePeriod(3000)).toBe(TimePeriod.HOURLY); // ~50 minutes
      expect(getClosestTimePeriod(4000)).toBe(TimePeriod.HOURLY); // ~66 minutes
    });

    it('should return DAILY for values closer to 1 day', () => {
      expect(getClosestTimePeriod(80000)).toBe(TimePeriod.DAILY); // ~22 hours
      expect(getClosestTimePeriod(90000)).toBe(TimePeriod.DAILY); // ~25 hours
    });

    it('should return WEEKLY for values closer to 1 week', () => {
      expect(getClosestTimePeriod(500000)).toBe(TimePeriod.WEEKLY); // ~5.8 days
      expect(getClosestTimePeriod(700000)).toBe(TimePeriod.WEEKLY); // ~8.1 days
    });

    it('should return BIWEEKLY for values closer to 2 weeks', () => {
      expect(getClosestTimePeriod(1100000)).toBe(TimePeriod.BIWEEKLY); // ~12.7 days
      expect(getClosestTimePeriod(1300000)).toBe(TimePeriod.BIWEEKLY); // ~15 days
    });

    it('should return MONTHLY for values closer to 30 days', () => {
      expect(getClosestTimePeriod(2000000)).toBe(TimePeriod.MONTHLY); // ~23 days
      expect(getClosestTimePeriod(2800000)).toBe(TimePeriod.MONTHLY); // ~32 days
    });

    it('should return YEARLY for values closer to 365 days', () => {
      expect(getClosestTimePeriod(20000000)).toBe(TimePeriod.YEARLY); // ~231 days
      expect(getClosestTimePeriod(40000000)).toBe(TimePeriod.YEARLY); // ~463 days
    });

    it('should handle very small values', () => {
      expect(getClosestTimePeriod(1)).toBe(TimePeriod.HOURLY); // Closest to hourly
      expect(getClosestTimePeriod(100)).toBe(TimePeriod.HOURLY);
    });

    it('should handle very large values', () => {
      expect(getClosestTimePeriod(50000000)).toBe(TimePeriod.YEARLY); // ~578 days
      expect(getClosestTimePeriod(100000000)).toBe(TimePeriod.YEARLY); // ~1157 days
    });

    it('should handle boundary cases between periods', () => {
      // Exactly halfway between HOURLY (3,600) and DAILY (86,400)
      const halfwayHourlyDaily = (3600 + 86400) / 2; // 45,000
      const result = getClosestTimePeriod(halfwayHourlyDaily);
      expect([TimePeriod.HOURLY, TimePeriod.DAILY]).toContain(result);
    });

    it('should accept values up to 10 years', () => {
      const tenYears = 60 * 60 * 24 * 365 * 10;
      expect(() => getClosestTimePeriod(tenYears)).not.toThrow();
      expect(getClosestTimePeriod(tenYears)).toBe(TimePeriod.YEARLY);
    });
  });
});
