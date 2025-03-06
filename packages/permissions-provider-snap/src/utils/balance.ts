import type { Hex } from 'viem';
import { formatUnits } from 'viem';

export const weiToEth = (
  wei: string | number | Hex,
  decimalPlaces = 2,
  tokenDecimal = 18,
): string => {
  const ethBalance = formatUnits(BigInt(wei), tokenDecimal);
  const ethBalanceNum = parseFloat(ethBalance);
  return ethBalanceNum.toFixed(decimalPlaces);
};
