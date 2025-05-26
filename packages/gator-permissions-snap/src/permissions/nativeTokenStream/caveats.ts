import type { CoreCaveatBuilder } from '@metamask/delegation-toolkit';

import type { PopulatedNativeTokenStreamPermission } from './types';

/**
 * Appends permission-specific caveats to the caveat builder.
 * @param options0 - The options object containing the permission and caveat builder.
 * @param options0.permission - The complete native token stream permission containing stream parameters.
 * @param options0.caveatBuilder - The core caveat builder to append caveats to.
 * @returns The modified caveat builder with appended native token stream caveats.
 */
export async function appendCaveats({
  permission,
  caveatBuilder,
}: {
  permission: PopulatedNativeTokenStreamPermission;
  caveatBuilder: CoreCaveatBuilder;
}): Promise<CoreCaveatBuilder> {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

  caveatBuilder
    .addCaveat(
      'nativeTokenStreaming',
      BigInt(initialAmount),
      BigInt(maxAmount),
      BigInt(amountPerSecond),
      startTime,
    )
    // don't allow any calldata as this could be used to extract additional authority
    // not included in a native token stream permission
    .addCaveat('exactCalldata', '0x');

  return caveatBuilder;
}
