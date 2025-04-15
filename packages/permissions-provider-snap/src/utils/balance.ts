import type { Hex } from 'viem';
import { formatUnits, maxUint256, parseUnits, toHex } from 'viem';

/**
 * Formats a token balance to a human-readable string.
 * @param wei - The token balance in wei as a string, number, or Hex.
 * @param tokenDecimal - The number of decimal places the token uses.
 * @returns The formatted human-readable token balance.
 */
export const formatTokenBalance = (
  wei: string | number | Hex,
  tokenDecimal = 18,
): string => {
  const formattedBalance = formatUnits(BigInt(wei), tokenDecimal);
  return formattedBalance;
};

/**
 * Converts a token balance to a hex string with the given decimal places.
 * @param value - The value to convert.
 * @param tokenDecimal - The number of decimal places the token uses.
 * @returns The hex string.
 */
export const convertValueToHex = (
  value: string | number,
  tokenDecimal = 18,
): Hex => {
  return toHex(parseUnits(value.toString(), tokenDecimal));
};

/**
 * Parses a max allowance value.
 * @param value - The value to parse.
 * @returns The parsed value.
 */
export const maxAllowanceParser = (value: string) => {
  if (value === 'Unlimited') {
    return toHex(maxUint256);
  }
  return convertValueToHex(value);
};

/**
 * Parses a zero default value.
 * @param value - The value to parse.
 * @returns The parsed value.
 */
export const zeroDefaultParser = (value: string | null | undefined) => {
  if (!value) {
    return convertValueToHex('0');
  }
  return convertValueToHex(value);
};
