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
 * Converts a human-readable date format (MM/DD/YYYY) to a unix timestamp (in seconds) at 12:00:00 AM.
 *
 * @param date - The human-readable date string.
 * @returns The unix timestamp in seconds.
 */
export const convertReadableDateToTimestampToday = (date: string) => {
  const [month, day, year] = date.split('/');
  if (!month || !day || !year) {
    throw new Error('Invalid date format');
  }

  const parsedDate = new Date(`${year}-${month}-${day}T00:00:00`);
  return Math.floor(parsedDate.getTime() / 1000);
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
