import type { Hex } from 'viem';
import { getAddress } from 'viem';
import { z } from 'zod';

export type { ZodIssue } from 'zod';

export const zAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/u, 'Invalid Ethereum address')
  .transform((value) => {
    return getAddress(value);
  });

export const zHexStr = z
  .string()
  .regex(/^0x[a-fA-F0-9]*$/u, 'Invalid hex value')
  .transform((value) => {
    return value as Hex;
  });

export const zBigInt = z.bigint();
