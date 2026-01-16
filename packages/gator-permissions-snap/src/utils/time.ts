import { zTimestamp } from '@metamask/7715-permissions-shared/types';
import { InvalidInputError } from '@metamask/snaps-sdk';

import { TimePeriod } from '../core/types';

/**
 * Returns the Unix timestamp (in seconds) for the start of today (12:00 AM UTC).
 * @returns Unix timestamp at 12:00:00 AM UTC of today.
 */
export const getStartOfTodayUTC = (): number => {
  const now = new Date();
  const startOfTodayUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0,
    0,
    0,
  );
  return Math.floor(startOfTodayUTC / 1000);
};

/**
 * Returns the Unix timestamp (in seconds) for the start of today (12:00 AM local time).
 *
 * @returns Unix timestamp at 12:00:00 AM local time of today.
 */
export const getStartOfTodayLocal = (): number => {
  const now = new Date();
  const startOfTodayLocal = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );
  return Math.floor(startOfTodayLocal.getTime() / 1000);
};

/**
 * Returns the Unix timestamp (in seconds) for the start of the next day (12:00 AM UTC).
 * @returns Unix timestamp at 12:00:00 AM UTC of the next day.
 */
export const getStartOfNextDayUTC = (): number => {
  const now = new Date();
  const startOfTomorrowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
  );
  return Math.floor(startOfTomorrowUTC / 1000);
};

/**
 * A mapping of time periods to their equivalent seconds.
 */
export const TIME_PERIOD_TO_SECONDS: Record<TimePeriod, bigint> = {
  [TimePeriod.HOURLY]: 60n * 60n, // 3,600 seconds (1 hour)
  [TimePeriod.DAILY]: 60n * 60n * 24n, // 86,400 seconds (1 day)
  [TimePeriod.WEEKLY]: 60n * 60n * 24n * 7n, // 604,800 seconds (7 days)
  [TimePeriod.BIWEEKLY]: 60n * 60n * 24n * 14n, // 1,209,600 seconds (14 days)
  [TimePeriod.MONTHLY]: 60n * 60n * 24n * 30n, // 2,592,000 seconds (approximated as 30 days, real months vary 28-31 days)
  [TimePeriod.YEARLY]: 60n * 60n * 24n * 365n, // 31,536,000 seconds (365 days, does not account for leap years)
};

/**
 * Finds the closest TimePeriod enum value for a given duration in seconds.
 * Uses absolute difference to find the nearest match by comparing against all
 * predefined time periods (HOURLY, DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY).
 *
 * @param seconds - The duration in seconds to match. Must be positive and reasonable.
 * @returns The TimePeriod that most closely matches the given duration.
 * @example
 * getClosestTimePeriod(80000) // Returns TimePeriod.DAILY (~22 hours)
 * getClosestTimePeriod(1300000) // Returns TimePeriod.BIWEEKLY (~15 days)
 */
export const getClosestTimePeriod = (seconds: number): TimePeriod => {
  const timePeriodEntries = Object.entries(TIME_PERIOD_TO_SECONDS) as [
    TimePeriod,
    bigint,
  ][];

  let closestPeriod = TimePeriod.HOURLY;
  let minDifference = Number.MAX_SAFE_INTEGER;

  for (const [period, periodValue] of timePeriodEntries) {
    const difference = Math.abs(seconds - Number(periodValue));

    if (difference < minDifference) {
      minDifference = difference;
      closestPeriod = period;
    }
  }

  return closestPeriod;
};

const TEN_YEARS = 10 * 365 * 24 * 60 * 60; // 10 years in seconds
/**
 * period duration in seconds, mapped to closest TransferWindow enum value
 */
export const zPeriodDuration = zTimestamp
  .max(TEN_YEARS, {
    message: `Period duration must be less than or equal to ${TEN_YEARS} seconds (10 years).`,
  })
  .transform((val) => {
    const periodType = getClosestTimePeriod(val);
    return Number(TIME_PERIOD_TO_SECONDS[periodType]);
  });

/**
 * Converts a Unix timestamp (in seconds) to an ISO 8601 date string with timezone.
 * This format is required by the snaps-sdk DateTimePicker component.
 *
 * @param timestamp - The Unix timestamp in seconds.
 * @returns An ISO 8601 formatted date string (e.g., "2024-01-15T10:30:00.000Z").
 */
export const timestampToISO8601 = (timestamp: number): string => {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  if (isNaN(date.getTime())) {
    throw new InvalidInputError(
      `timestampToISO8601: Invalid timestamp: ${timestamp}`,
    );
  }

  return date.toISOString();
};

/**
 * Converts an ISO 8601 date string to a Unix timestamp (in seconds).
 * This is used to convert DateTimePicker values back to timestamps.
 *
 * @param iso - The ISO 8601 formatted date string.
 * @returns The Unix timestamp in seconds.
 */
export const iso8601ToTimestamp = (iso: string): number => {
  const date = new Date(iso);

  if (isNaN(date.getTime())) {
    throw new InvalidInputError(
      `iso8601ToTimestamp: Invalid ISO 8601 string: ${iso}`,
    );
  }

  return Math.floor(date.getTime() / 1000);
};
