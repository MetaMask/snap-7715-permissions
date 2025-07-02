import type { Hex } from '@metamask/delegation-core';

/**
 * Formats a token value to a human-readable string.
 * @param value - The token value in wei as a bigint.
 * @param decimals - The number of decimal places the token uses.
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
  const trimmedFractionalPart = fractionalPart.replace(/0+$/, '');

  if (trimmedFractionalPart.length > 0) {
    return `${decimalPart}.${trimmedFractionalPart}`;
  }
  return decimalPart;
};

/**
 * Formats a token value to a human-readable string, from a hex string.
 * @param args - The arguments to format.
 * @param args.value - The value to format.
 * @param args.allowUndefined - Whether to allow undefined values.
 * @param args.decimals - The number of decimal places the token uses.
 * @returns The formatted value.
 */
export const formatUnitsFromHex = <
  TAllowUndefined extends boolean,
  TDecimals extends number,
>({
  value,
  allowUndefined,
  decimals,
}: {
  value: TAllowUndefined extends true ? Hex | undefined : Hex;
  allowUndefined: TAllowUndefined;
  decimals: TDecimals;
}): TAllowUndefined extends true ? string | undefined : string => {
  if (value === undefined) {
    if (allowUndefined) {
      return undefined as TAllowUndefined extends true ? Hex | undefined : Hex;
    }

    throw new Error('Value is undefined');
  }

  return formatUnits({ value: BigInt(value), decimals });
};

/**
 * Parses a human-readable string to a token value.
 * @param args - The arguments to parse.
 * @param args.value - The human-readable string value to parse.
 * @param args.decimals - The number of decimal places the token uses.
 * @returns The parsed value as a BigInt.
 */
export function parseUnits({
  formatted,
  decimals,
}: {
  formatted: string;
  decimals: number;
}) {
  if (!/^(-?)([0-9]*)\.?([0-9]*)$/.test(formatted))
    throw new Error('Invalid numeric value: ' + formatted);

  let [integerPart = '0', fractionPart = '0'] = formatted.split('.');

  const isNegative = integerPart.startsWith('-');
  if (isNegative) integerPart = integerPart.slice(1);

  fractionPart = fractionPart.replace(/(0+)$/, '');

  if (decimals === 0) {
    if (Math.round(Number(`.${fractionPart}`)) === 1)
      integerPart = `${BigInt(integerPart) + 1n}`;
    fractionPart = '';
  } else if (fractionPart.length > decimals) {
    const [left, unit, right] = [
      fractionPart.slice(0, decimals - 1),
      fractionPart.slice(decimals - 1, decimals),
      fractionPart.slice(decimals),
    ];

    const rounded = Math.round(Number(`${unit}.${right}`));
    if (rounded > 9)
      fractionPart = `${BigInt(left) + BigInt(1)}0`.padStart(
        left.length + 1,
        '0',
      );
    else fractionPart = `${left}${rounded}`;

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
