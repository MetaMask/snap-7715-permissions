import type { Hex } from 'viem';
import { formatUnits } from 'viem';

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
