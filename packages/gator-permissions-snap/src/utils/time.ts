import { InvalidInputError } from '@metamask/snaps-sdk';

import { TimePeriod } from '../core/types';

/**
 * Converts a unix timestamp(in seconds) to a human-readable date format.
 *
 * @param timestamp - The unix timestamp in seconds.
 * @returns The formatted date string in mm/dd/yyyy format.
 */
export const convertTimestampToReadableDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  if (isNaN(date.getTime())) {
    throw new InvalidInputError(
      'convertTimestampToReadableDate: Invalid date format',
    );
  }

  // Always format as mm/dd/yyyy using local time
  const month = String(date.getMonth() + 1).padStart(2, '0'); // JavaScript months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

/**
 * Converts a unix timestamp(in seconds) to a human-readable time format (HH:MM:SS).
 *
 * @param timestamp - The unix timestamp in seconds.
 * @returns The formatted time string.
 */
export const convertTimestampToReadableTime = (timestamp: number) => {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  if (isNaN(date.getTime())) {
    throw new InvalidInputError('Invalid time format');
  }

  // Get local components instead of UTC
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // Format the time as HH:MM:SS in local time
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Converts a human-readable date string to a Unix timestamp.
 * This function expects dates in mm/dd/yyyy format.
 *
 * @param date - The human-readable date string in mm/dd/yyyy format.
 * @returns The unix timestamp in seconds.
 */
export const convertReadableDateToTimestamp = (date: string) => {
  // Check if the input is already a timestamp (numeric string)
  const numericValue = Number(date);
  if (
    !isNaN(numericValue) &&
    numericValue > 0 &&
    Number.isInteger(numericValue)
  ) {
    // Validate that the timestamp represents a reasonable date (1/1/2000)
    if (numericValue < 1262304000) {
      throw new InvalidInputError(
        'Invalid date format. Expected format: mm/dd/yyyy',
      );
    }

    // Validate that the timestamp represents a reasonable date
    const timestampDate = new Date(numericValue * 1000);
    if (isNaN(timestampDate.getTime())) {
      throw new InvalidInputError(
        'Invalid date format. Expected format: mm/dd/yyyy',
      );
    }

    // If it's a valid positive integer representing a reasonable date, assume it's already a timestamp
    return numericValue;
  }

  // Parse mm/dd/yyyy format
  const parts = date.split('/');
  if (parts.length !== 3) {
    throw new InvalidInputError(
      'Invalid date format. Expected format: mm/dd/yyyy',
    );
  }

  const [monthStr, dayStr, yearStr] = parts;

  if (!monthStr || !dayStr || !yearStr) {
    throw new InvalidInputError(
      'Invalid date format. Expected format: mm/dd/yyyy',
    );
  }

  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);

  // Validate that all parts are valid numbers
  if (isNaN(month) || isNaN(day) || isNaN(year)) {
    throw new InvalidInputError(
      'Invalid date format. Expected format: mm/dd/yyyy',
    );
  }

  // Validate ranges
  if (month < 1 || month > 12) {
    throw new InvalidInputError(
      'Invalid month. Month must be between 1 and 12.',
    );
  }

  if (day < 1 || day > 31) {
    throw new InvalidInputError('Invalid day. Day must be between 1 and 31.');
  }

  if (year < 1900) {
    throw new InvalidInputError('Invalid year.');
  }

  // Create the date using local time (JavaScript months are 0-indexed)
  const parsedDate = new Date(year, month - 1, day);

  // Validate the date (handles edge cases like February 30th)
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    throw new InvalidInputError(
      'Invalid date. The specified date does not exist.',
    );
  }

  // Return the local timestamp (at 00:00:00 local time)
  return Math.floor(parsedDate.getTime() / 1000);
};

/**
 * Converts a human-readable time (HH:MM:SS) to seconds since midnight UTC.
 *
 * @param time - The human-readable time string.
 * @returns The seconds since midnight UTC.
 */
export const convertReadableTimeToSeconds = (time: string) => {
  const [hours, minutes, seconds] = time.split(':');
  if (!hours || !minutes || !seconds) {
    throw new InvalidInputError('Invalid time format');
  }

  const hoursNum = Number(hours);
  const minutesNum = Number(minutes);
  const secondsNum = Number(seconds);

  // Validate that all parts are valid numbers
  if (isNaN(hoursNum) || isNaN(minutesNum) || isNaN(secondsNum)) {
    throw new InvalidInputError(
      'Invalid time format: all parts must be numbers',
    );
  }

  // Validate ranges
  if (hoursNum < 0 || hoursNum > 23) {
    throw new InvalidInputError(
      'Invalid time format: hours must be between 0 and 23',
    );
  }
  if (minutesNum < 0 || minutesNum > 59) {
    throw new InvalidInputError(
      'Invalid time format: minutes must be between 0 and 59',
    );
  }
  if (secondsNum < 0 || secondsNum > 59) {
    throw new InvalidInputError(
      'Invalid time format: seconds must be between 0 and 59',
    );
  }

  return hoursNum * 3600 + minutesNum * 60 + secondsNum;
};

/**
 * Combines a date string (mm/dd/yyyy) and time string (HH:MM:SS) into a Unix timestamp.
 *
 * @param date - The human-readable date string in mm/dd/yyyy format.
 * @param time - The human-readable time string.
 * @returns The unix timestamp in seconds.
 */
export const combineDateAndTimeToTimestamp = (date: string, time: string) => {
  const dateTimestamp = convertReadableDateToTimestamp(date);
  const timeSeconds = convertReadableTimeToSeconds(time);
  return dateTimestamp + timeSeconds;
};

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
  [TimePeriod.HOURLY]: 60n * 60n, // 3,600(seconds)
  [TimePeriod.DAILY]: 60n * 60n * 24n, // 86,400(seconds)
  [TimePeriod.WEEKLY]: 60n * 60n * 24n * 7n, // 604,800(seconds), 7 days
  [TimePeriod.BIWEEKLY]: 60n * 60n * 24n * 14n, // 1,209,600(seconds), 14 days
  [TimePeriod.MONTHLY]: 60n * 60n * 24n * 30n, // 2,592,000(seconds), 30 days
  [TimePeriod.YEARLY]: 60n * 60n * 24n * 365n, // 31,536,000(seconds), 365 days
};

/**
 * Finds the closest TimePeriod enum value for a given duration in seconds.
 *
 * @param seconds - The duration in seconds to match.
 * @returns The TimePeriod that most closely matches the given duration.
 * @throws InvalidInputError if no time periods are available.
 */
export const getClosestTimePeriod = (seconds: bigint): TimePeriod => {
  const timePeriodEntries = Object.entries(TIME_PERIOD_TO_SECONDS) as [
    TimePeriod,
    bigint,
  ][];

  const firstEntry = timePeriodEntries[0];
  if (!firstEntry) {
    throw new InvalidInputError('No time periods available');
  }

  let closestPeriod = firstEntry[0];
  let minDifference =
    seconds > firstEntry[1] ? seconds - firstEntry[1] : firstEntry[1] - seconds;

  for (const [period, periodValue] of timePeriodEntries.slice(1)) {
    const difference =
      seconds > periodValue ? seconds - periodValue : periodValue - seconds;
    if (difference < minDifference) {
      minDifference = difference;
      closestPeriod = period;
    }
  }

  return closestPeriod;
};
