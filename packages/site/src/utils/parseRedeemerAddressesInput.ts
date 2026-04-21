import { getAddress, isAddress } from 'viem';
import type { Hex } from 'viem';

/**
 * Parses comma- or whitespace-separated EVM addresses and returns checksum addresses.
 * Invalid segments are skipped.
 *
 * @param input - Raw user input, e.g. comma-separated 0x-prefixed addresses.
 * @returns Deduped checksum `Hex` addresses, in order of first appearance.
 */
export function parseRedeemerAddressesInput(input: string): Hex[] {
  const segments = input
    .split(/[,;\s]+/u)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: Hex[] = [];
  for (const seg of segments) {
    if (!isAddress(seg)) {
      continue;
    }
    const addr = getAddress(seg);
    const key = addr.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(addr);
  }
  return out;
}
