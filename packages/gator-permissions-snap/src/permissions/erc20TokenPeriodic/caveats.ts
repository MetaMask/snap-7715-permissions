import type { CoreCaveatBuilder } from '@metamask/delegation-toolkit';

import type { PopulatedErc20TokenPeriodicPermission } from './types';

/**
 * Appends permission-specific caveats to the caveat builder.
 * @param options0 - The options object containing the permission and caveat builder.
 * @param options0.permission - The complete ERC20 token periodic permission containing periodic parameters.
 * @param options0.caveatBuilder - The core caveat builder to append caveats to.
 * @returns The modified caveat builder with appended ERC20 token periodic caveats.
 */
export async function appendCaveats({
  permission,
  caveatBuilder,
}: {
  permission: PopulatedErc20TokenPeriodicPermission;
  caveatBuilder: CoreCaveatBuilder;
}): Promise<CoreCaveatBuilder> {
  const { periodAmount, periodDuration, startTime, tokenAddress } =
    permission.data;

  caveatBuilder
    .addCaveat(
      'erc20PeriodTransfer',
      tokenAddress,
      BigInt(periodAmount),
      periodDuration,
      startTime,
    )
    .addCaveat('valueLte', 0n);

  return caveatBuilder;
}
