import type { Hex } from 'viem';
import { formatUnits, parseUnits, toHex } from 'viem';

/**
 * Formats a token balance to a human-readable string.
 * @param wei - The token balance in wei as a string, number, or Hex.
 * @param decimalPlaces - The number of decimal places to display in the formatted balance.
 * @param tokenDecimal - The number of decimal places the token uses.
 * @returns The formatted human-readable token balance.
 */
export const formatTokenBalance = (
  wei: string | number | Hex,
  decimalPlaces = 2,
  tokenDecimal = 18,
): string => {
  const ethBalance = formatUnits(BigInt(wei), tokenDecimal);
  const ethBalanceNum = parseFloat(ethBalance);
  return ethBalanceNum.toFixed(decimalPlaces);
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
 * Returns the maximum value for a uint256.
 * @returns The maximum value for a uint256.
 */
export const getMaxUint256 = (): Hex => {
  return `0x${(BigInt(2) ** BigInt(256) - BigInt(1)).toString(16)}`;
};

/**
 * Parses a max allowance value.
 * @param value - The value to parse.
 * @returns The parsed value.
 */
export const maxAllowanceParser = (value: string | null) => {
  if (value === null) {
    return null;
  }
  if (value === 'Unlimited') {
    return getMaxUint256();
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
