import {
  TRUNCATED_ADDRESS_END_CHARS,
  TRUNCATED_ADDRESS_START_CHARS,
  TRUNCATED_NAME_CHAR_LIMIT,
} from '../constants';

/**
 * Shortens the given string, preserving the beginning and end.
 * Returns the string it is no longer than truncatedCharLimit.
 *
 * @param stringToShorten - The string to shorten.
 * @param options - The options to use when shortening the string.
 * @param options.truncatedCharLimit - The maximum length of the string.
 * @param options.truncatedStartChars - The number of characters to preserve at the beginning.
 * @param options.truncatedEndChars - The number of characters to preserve at the end.
 * @param options.skipCharacterInEnd - Skip the character at the end.
 * @returns The shortened string.
 */
export function shortenString(
  stringToShorten = '',
  {
    truncatedCharLimit,
    truncatedStartChars,
    truncatedEndChars,
    skipCharacterInEnd,
  } = {
    truncatedCharLimit: TRUNCATED_NAME_CHAR_LIMIT,
    truncatedStartChars: TRUNCATED_ADDRESS_START_CHARS,
    truncatedEndChars: TRUNCATED_ADDRESS_END_CHARS,
    skipCharacterInEnd: false,
  },
) {
  if (stringToShorten.length < truncatedCharLimit) {
    return stringToShorten;
  }

  return `${stringToShorten.slice(0, truncatedStartChars)}...${
    skipCharacterInEnd ? '' : stringToShorten.slice(-truncatedEndChars)
  }`;
}

/**
 * Shortens an Ethereum address for display, preserving the beginning and end.
 * Returns the given address if it is no longer than 10 characters.
 * Shortened addresses are 13 characters long.
 *
 * Example output: 0xabcde...12345.
 *
 * @param address - The address to shorten.
 * @returns The shortened address, or the original if it was no longer
 * than 10 characters.
 */
export function shortenAddress(address = '') {
  return shortenString(address, {
    truncatedCharLimit: TRUNCATED_NAME_CHAR_LIMIT,
    truncatedStartChars: TRUNCATED_ADDRESS_START_CHARS,
    truncatedEndChars: TRUNCATED_ADDRESS_END_CHARS,
    skipCharacterInEnd: false,
  });
}

/**
 * Truncates the decimal part of a numeric string to a specified number of digits.
 * If the input is not a valid number, returns the original value.
 *
 * @param value - The numeric string to truncate (e.g., "123.456789").
 * @param decimalPlaces - The maximum number of decimal places to keep. Defaults to 8.
 * @returns The truncated numeric string, or the original value if not a valid number.
 *
 * @example
 * truncateDecimalPlaces("123.456789123", 4); // "123.4567"
 * truncateDecimalPlaces("100", 4); // "100"
 * truncateDecimalPlaces("abc", 4); // "abc"
 */
export function truncateDecimalPlaces(
  value: string,
  decimalPlaces = 8,
): string {
  const trimmedValue = value.trim();
  // Only allow optional minus, digits, optional decimal and digits
  if (!/^[-+]?\d+(\.\d+)?$/u.test(trimmedValue)) {
    return value;
  }
  const [whole = '', decimals = ''] = trimmedValue.split('.');
  if (!decimals) {
    return whole;
  }
  return `${whole}.${decimals.slice(0, decimalPlaces)}`;
}
