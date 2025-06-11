import type { CoreCaveatBuilder } from '@metamask/delegation-toolkit';

import type { PopulatedErc20TokenStreamPermission } from './types';

/**
 * Appends permission-specific caveats to the caveat builder.
 * @param options0 - The options object containing the permission and caveat builder.
 * @param options0.permission - The complete ERC20 token stream permission containing stream parameters.
 * @param options0.caveatBuilder - The core caveat builder to append caveats to.
 * @returns The modified caveat builder with appended ERC20 token stream caveats.
 */
export async function appendCaveats({
  permission,
  caveatBuilder,
}: {
  permission: PopulatedErc20TokenStreamPermission;
  caveatBuilder: CoreCaveatBuilder;
}): Promise<CoreCaveatBuilder> {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

  caveatBuilder.addCaveat(
    'erc20Streaming',
    permission.data.tokenAddress,
    BigInt(initialAmount),
    BigInt(maxAmount),
    BigInt(amountPerSecond),
    startTime,
  );

  return caveatBuilder;
}
