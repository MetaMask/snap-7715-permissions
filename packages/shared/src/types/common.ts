import type { Hex } from '@metamask/delegation-core';
import { getChecksumAddress } from '@metamask/utils';
import { z } from 'zod';

export type { ZodIssue } from 'zod';

export const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000' as const;

export const zAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/u, 'Invalid Ethereum address')
  .transform((value) => {
    return getChecksumAddress(value as Hex);
  });

/**
 * Ethereum address validator that rejects the zero address (0x0000...0000).
 */
export const zAddressNotZeroAddress = zAddress.refine(
  (value) => value !== ZERO_ADDRESS,
  {
    message: 'Address cannot be the zero address',
  },
);

export const zHexStr = z
  .string()
  .regex(/^0x[a-fA-F0-9]*$/u, 'Invalid hex value')
  .transform((value) => {
    return value as Hex;
  });

export const zHexStrNullableOptional = zHexStr.optional().nullable();
export const zBigInt = z.bigint();
