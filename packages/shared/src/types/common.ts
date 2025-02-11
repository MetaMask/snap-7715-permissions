import type { Address, Hex } from 'viem';
import { getAddress, toHex } from 'viem';
import { z } from 'zod';

export type { ZodIssue } from 'zod';

export const zAddress = z.custom<Address>().transform((value) => {
  return getAddress(value);
});

export const zHexStr = z.custom<Hex>().transform((value) => {
  return toHex(value);
});

export const zBigInt = z.bigint();
