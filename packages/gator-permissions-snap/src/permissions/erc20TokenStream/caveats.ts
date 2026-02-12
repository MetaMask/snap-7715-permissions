import {
  createERC20StreamingTerms,
  createValueLteTerms,
} from '@metamask/delegation-core';
import type { Caveat } from '@metamask/delegation-core';

import type { PopulatedErc20TokenStreamPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

/**
 * ERC-20 token stream permission
 * -----------------------------
 * This permission allows a delegate to stream ERC-20 tokens from the grantor at a bounded rate:
 * the delegate may transfer tokens up to a cap (maxAmount), with an optional initial amount and
 * a rate limit (amountPerSecond) from a given startTime. The caveats below enforce the rate and
 * cap and forbid sending native value with the delegation.
 *
 * Caveats and enforcers
 * ---------------------
 * ERC20StreamingEnforcer: enforces the streaming terms (token, initial/max amount, rate, start
 * time) so that only allowed ERC-20 transfers within the stream limits are permitted.
 * ValueLteEnforcer: caps native value at zero so the delegation cannot send ETH/native token
 * (only the specified ERC-20 token is streamed).
 */

/**
 * Appends permission-specific caveats to the caveat builder.
 *
 * @param options0 - The options object containing the permission and caveat builder.
 * @param options0.permission - The complete ERC20 token stream permission containing stream parameters.
 * @param options0.contracts - The contracts object containing enforcers.
 * @returns The modified caveat builder with appended ERC20 token stream caveats.
 */
export async function createPermissionCaveats({
  permission,
  contracts,
}: {
  permission: PopulatedErc20TokenStreamPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

  // ERC20StreamingEnforcer: enforce token address, initial/max amount, rate (amountPerSecond), and start time.
  const erc20StreamingCaveat: Caveat = {
    enforcer: contracts.erc20StreamingEnforcer,
    terms: createERC20StreamingTerms({
      tokenAddress: permission.data.tokenAddress,
      initialAmount: BigInt(initialAmount),
      maxAmount: BigInt(maxAmount),
      amountPerSecond: BigInt(amountPerSecond),
      startTime,
    }),
    args: '0x',
  };

  // ValueLteEnforcer: allow no native value (e.g. msg.value must be 0).
  const valueLteCaveat: Caveat = {
    enforcer: contracts.valueLteEnforcer,
    terms: createValueLteTerms({
      maxValue: 0n,
    }),
    args: '0x',
  };

  return [erc20StreamingCaveat, valueLteCaveat];
}
