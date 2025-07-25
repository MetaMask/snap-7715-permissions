import { TimePeriod } from '../core/types';

/**
 * Converts a unix timestamp(in seconds) to a human-readable date format based on locale.
 *
 * @param timestamp - The unix timestamp in seconds.
 * @returns The formatted date string based on user's locale.
 */
export const convertTimestampToReadableDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  if (isNaN(date.getTime())) {
    throw new Error('convertTimestampToReadableDate: Invalid date format');
  }

  // Use browser's locale to format the date appropriately
  // This will automatically use MM/DD/YYYY for US locale, DD/MM/YYYY for European locales, etc.
  return date.toLocaleDateString();
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
    throw new Error('Invalid time format');
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
 * This function tries to parse the date in the user's locale format first,
 * then falls back to common formats if that fails.
 *
 * @param date - The human-readable date string.
 * @returns The unix timestamp in seconds.
 */
export const convertReadableDateToTimestamp = (date: string) => {
  console.log('convertReadableDateToTimestamp', date);

  if (date == '') {
    throw new Error('Invalid date format');
  }
  
  // Check if the input is already a timestamp (numeric string)
  const numericValue = Number(date);
  if (!isNaN(numericValue) && numericValue > 0 && Number.isInteger(numericValue)) {
    // If it's a valid positive integer, assume it's already a timestamp
    return numericValue;
  }
  
  // First, try to parse using the browser's locale
  const parsedDate = new Date(date);
  console.log('parsedDate', parsedDate);
  
  // If the date is valid and not NaN, use it
  if (!isNaN(parsedDate.getTime())) {
    // Set the time to 00:00:00 in the user's local timezone
    parsedDate.setHours(0, 0, 0, 0);
    return Math.floor(parsedDate.getTime() / 1000);
  }

  throw new Error('Invalid date format');
};

/**
 * Converts a human-readable time (HH:MM:SS) to seconds since midnight UTC.
 *
 * @param time - The human-readable time string.
 * @returns The seconds since midnight UTC.
 */
export const convertReadableTimeToSeconds = (time: string) => {
  console.log("convertReadableTimeToSeconds:", time);
  const [hours, minutes, seconds] = time.split(':');
  if (!hours || !minutes || !seconds) {
    throw new Error('Invalid time format');
  }

  const hoursNum = Number(hours);
  const minutesNum = Number(minutes);
  const secondsNum = Number(seconds);

  // Validate that all parts are valid numbers
  if (isNaN(hoursNum) || isNaN(minutesNum) || isNaN(secondsNum)) {
    throw new Error('Invalid time format: all parts must be numbers');
  }

  // Validate ranges
  if (hoursNum < 0 || hoursNum > 23) {
    throw new Error('Invalid time format: hours must be between 0 and 23');
  }
  if (minutesNum < 0 || minutesNum > 59) {
    throw new Error('Invalid time format: minutes must be between 0 and 59');
  }
  if (secondsNum < 0 || secondsNum > 59) {
    throw new Error('Invalid time format: seconds must be between 0 and 59');
  }

  return hoursNum * 3600 + minutesNum * 60 + secondsNum;
};

/**
 * Combines a date string (MM/DD/YYYY) and time string (HH:MM:SS) into a Unix timestamp.
 *
 * @param date - The human-readable date string.
 * @param time - The human-readable time string.
 * @returns The unix timestamp in seconds.
 */
export const combineDateAndTimeToTimestamp = (date: string, time: string) => {
  console.log('combineDateAndTimeToTimestamp', date, time);
  const dateTimestamp = convertReadableDateToTimestamp(date);
  console.log('dateTimestamp', dateTimestamp);
  const timeSeconds = convertReadableTimeToSeconds(time);
  console.log('timeSeconds', timeSeconds);
  return dateTimestamp + timeSeconds;
};

/**
 * Checks if a human-readable date string is in a valid format.
 * This function tries to parse the date using the browser's locale first,
 * then falls back to common formats.
 *
 * @param date - The human-readable date string.
 * @returns True if the date is in a valid format, otherwise false.
 */
export const isHumanReadableInCorrectFormat = (date: string) => {
  // First, try to parse using the browser's locale
  const parsedDate = new Date(date);
  if (!isNaN(parsedDate.getTime())) {
    return true;
  }

  // Fallback: check MM/DD/YYYY format (for backward compatibility)
  const [month, day, year] = date.split('/');
  if (!month || !day || !year) {
    return false;
  }
  return true;
};

/**
 * Returns the Unix timestamp (in seconds) for the start of today (12:00 AM UTC).
 *
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
 *
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
  [TimePeriod.DAILY]: 60n * 60n * 24n, // 86,400(seconds)
  [TimePeriod.WEEKLY]: 60n * 60n * 24n * 7n, // 604,800(seconds)
  // Monthly is difficult because months are not consistent in length.
  // We approximate by calculating the number of seconds in 1/12th of a year.
  [TimePeriod.MONTHLY]: (60n * 60n * 24n * 365n) / 12n, // 2,629,760(seconds)
};
