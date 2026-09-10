import type { Hex } from '@metamask/delegation-core';
import { bytesToHex, stringToBytes } from '@metamask/utils';
import { keccak_256 as keccak256 } from '@noble/hashes/sha3';

const FOUR_BYTE_SELECTOR_REGEX = /^0x[0-9a-fA-F]{8}$/u;
const FUNCTION_SIGNATURE_REGEX = /^[A-Za-z_$][\w$]*\(.*\)$/u;

/**
 * Checks whether a selector entry is a 4-byte hex function selector.
 * @param value - The selector entry to check.
 * @returns True when the value is a `0x`-prefixed 4-byte hex string.
 */
export function isFourByteSelector(value: string): boolean {
  return FOUR_BYTE_SELECTOR_REGEX.test(value);
}

/**
 * Checks whether a selector entry is an ABI function signature such as `transfer(address,uint256)`.
 * @param value - The selector entry to check.
 * @returns True when the value looks like a function signature.
 */
export function isFunctionSignature(value: string): boolean {
  return FUNCTION_SIGNATURE_REGEX.test(value);
}

/**
 * Normalizes a selector entry so that equivalent entries compare equal.
 * Hex selectors are lowercased; signatures have whitespace removed.
 * @param value - The selector entry to normalize.
 * @returns The normalized selector entry.
 */
export function normalizeSelector(value: string): string {
  if (isFourByteSelector(value)) {
    return value.toLowerCase();
  }

  return value.replace(/\s+/gu, '');
}

/**
 * Formats a selector entry for display in the confirmation UI.
 * Function signatures are reduced to the function name, because the argument
 * list is not meaningful to the user; 4-byte selectors are shown as-is.
 * @param value - The selector entry to format.
 * @returns The human-readable representation of the selector.
 */
export function formatSelectorForDisplay(value: string): string {
  if (isFunctionSignature(value)) {
    const functionName = value.slice(0, value.indexOf('('));
    return `${functionName}()`;
  }

  return value;
}

/**
 * Converts a selector entry into a 4-byte hex function selector.
 * Function signatures are hashed the same way Solidity derives selectors:
 * the first four bytes of `keccak256` of the canonical signature. Types must
 * be written in canonical form (for example `uint256`, not `uint`).
 * @param value - A 4-byte hex selector or an ABI function signature.
 * @returns The 4-byte hex selector.
 * @throws {Error} If the value is neither a 4-byte hex selector nor a function signature.
 */
export function toFourByteSelector(value: string): Hex {
  if (isFourByteSelector(value)) {
    return value.toLowerCase() as Hex;
  }

  if (!isFunctionSignature(value)) {
    throw new Error(
      'Invalid selector: must be a 4-byte hex selector or an ABI function signature',
    );
  }

  const hash = keccak256(stringToBytes(normalizeSelector(value)));
  return bytesToHex(hash.slice(0, 4));
}
