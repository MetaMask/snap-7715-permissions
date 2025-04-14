/**
 * Converts a unix timestamp(in seconds) to a human-readable date format (MM/DD/YYYY).
 *
 * @param timestamp - The unix timestamp in seconds.
 * @returns The formatted date string.
 */
export const convertTimestampToReadableDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  const formattedDate = date.toLocaleDateString('en-US', options);
  const [month, day, year] = formattedDate.split('/');
  if (!month || !day || !year) {
    throw new Error('Invalid date format');
  }

  // Format the date as MM/DD/YYYY
  return `${month}/${day}/${year}`;
};

/**
 * Converts a human-readable date (MM/DD/YYYY) to a Unix timestamp at 12:00:00 AM UTC.
 *
 * @param date - The human-readable date string.
 * @returns The unix timestamp in seconds.
 */
export const convertReadableDateToTimestamp = (date: string) => {
  const [month, day, year] = date.split('/');
  if (!month || !day || !year) {
    throw new Error('Invalid date format');
  }

  const utcDate = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0),
  );
  return Math.floor(utcDate.getTime() / 1000);
};

/**
 * Checks if a human-readable date format (MM/DD/YYYY) is in the correct format.
 *
 * @param date - The human-readable date string.
 * @returns True if the date is in the correct format, otherwise false.
 */
export const isHumanReadableInCorrectFormat = (date: string) => {
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
