import type { Hex } from '@metamask/delegation-core';
import { InvalidInputError } from '@metamask/snaps-sdk';

/**
 * Formats a token value to a human-readable string.
 * @param args - The arguments to format.
 * @param args.value - The token value in wei as a bigint.
 * @param args.decimals - The number of decimal places the token uses.
 * @returns The formatted human-readable token value.
 */
export const formatUnits = ({
  value,
  decimals,
}: {
  value: bigint;
  decimals: number;
}): string => {
  const valueString = value.toString().padStart(decimals + 1, '0');

  const decimalPart = valueString.slice(0, -decimals);
  const fractionalPart = valueString.slice(-decimals);
  const trimmedFractionalPart = fractionalPart.replace(/0+$/u, '');

  if (trimmedFractionalPart.length > 0) {
    return `${decimalPart}.${trimmedFractionalPart}`;
  }
  return decimalPart;
};

/**
 * Formats a token value to a human-readable string, from a hex string.
 * @param args - The arguments to format.
 * @param args.value - The value to format.
 * @param args.allowNull - Whether to allow null values.
 * @param args.decimals - The number of decimal places the token uses.
 * @returns The formatted value.
 */
export const formatUnitsFromHex = <
  TAllowNull extends boolean,
  TDecimals extends number,
>({
  value,
  allowNull,
  decimals,
}: {
  value: TAllowNull extends true ? Hex | undefined | null : Hex;
  allowNull: TAllowNull;
  decimals: TDecimals;
}): TAllowNull extends true ? string | null : string => {
  if (value === undefined || value === null) {
    if (allowNull) {
      return null as TAllowNull extends true ? Hex | null : Hex;
    }

    throw new InvalidInputError('Value is undefined');
  }

  return formatUnits({ value: BigInt(value), decimals });
};

/**
 * Parses a human-readable string to a token value.
 * @param args - The arguments to parse.
 * @param args.formatted - The human-readable string value to parse.
 * @param args.decimals - The number of decimal places the token uses.
 * @returns The parsed value as a BigInt.
 */
export function parseUnits({
  formatted,
  decimals,
}: {
  formatted: string;
  decimals: number;
}): bigint {
  if (!/^(-?)([0-9]*)\.?([0-9]*)$/u.test(formatted)) {
    throw new InvalidInputError(`Invalid numeric value: ${formatted}`);
  }

  let [integerPart = '0', fractionPart = '0'] = formatted.split('.');

  const isNegative = integerPart.startsWith('-');
  if (isNegative) {
    integerPart = integerPart.slice(1);
  }

  // Handle empty integer part (e.g., "-.5" becomes "" after removing "-")
  if (integerPart === '') {
    integerPart = '0';
  }

  // strip trailing 0s from the fraction part
  fractionPart = fractionPart.replace(/(0+)$/u, '');

  if (decimals === 0) {
    if (Math.round(Number(`.${fractionPart}`)) === 1) {
      integerPart = `${BigInt(integerPart) + 1n}`;
    }
    fractionPart = '';
  } else if (fractionPart.length > decimals) {
    const [left, unit, right] = [
      fractionPart.slice(0, decimals - 1),
      fractionPart.slice(decimals - 1, decimals),
      fractionPart.slice(decimals),
    ];

    const rounded = Math.round(Number(`${unit}.${right}`));
    if (rounded > 9) {
      // Handle empty left part (e.g., when decimals is 1 and left becomes "")
      const leftBigInt = left === '' ? 0n : BigInt(left);
      fractionPart = `${leftBigInt + 1n}0`.padStart(left.length + 1, '0');
    } else {
      fractionPart = `${left}${rounded}`;
    }

    if (fractionPart.length > decimals) {
      fractionPart = fractionPart.slice(1);
      integerPart = `${BigInt(integerPart) + 1n}`;
    }

    fractionPart = fractionPart.slice(0, decimals);
  } else {
    fractionPart = fractionPart.padEnd(decimals, '0');
  }

  return BigInt(`${isNegative ? '-' : ''}${integerPart}${fractionPart}`);
}
