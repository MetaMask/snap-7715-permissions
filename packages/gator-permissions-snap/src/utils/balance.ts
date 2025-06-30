import type { Hex } from '@metamask/delegation-core';
import { formatUnits } from 'viem';

/**
 * Formats a token balance to a human-readable string.
 * @param wei - The token balance in wei as a string, number, or Hex.
 * @param tokenDecimal - The number of decimal places the token uses.
 * @returns The formatted human-readable token balance.
 */
export const formatTokenBalance = (
  wei: string | number | Hex,
  tokenDecimal: number,
): string => {
  const formattedBalance = formatUnits(BigInt(wei), tokenDecimal);
  return formattedBalance;
};

/**
 * Formats a string value to a hex string.
 * @param args - The arguments to format.
 * @param args.value - The value to format.
 * @param args.allowUndefined - Whether to allow undefined values.
 * @param args.decimals - The number of decimal places the token uses.
 * @returns The formatted value.
 */
export const formatUnitsFromString = <
  TAllowUndefined extends boolean,
  TDecimals extends number,
>({
  value,
  allowUndefined,
  decimals,
}: {
  value: TAllowUndefined extends true ? string | undefined : string;
  allowUndefined: TAllowUndefined;
  decimals: TDecimals;
}): TAllowUndefined extends true ? string | undefined : string => {
  if (value === undefined) {
    if (allowUndefined) {
      return undefined as TAllowUndefined extends true
        ? string | undefined
        : string;
    }

    throw new Error('Value is undefined');
  }

  return formatUnits(BigInt(value), decimals);
};
