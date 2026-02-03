import {
  createNativeTokenStreamingTerms,
  createExactCalldataTerms,
} from '@metamask/delegation-core';
import type { Caveat } from '@metamask/delegation-core';

import type { PopulatedNativeTokenStreamPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

/**
 * Native token stream permission
 * ------------------------------
 * This permission allows a delegate to stream the chain’s native token (e.g. ETH) from the
 * grantor at a bounded rate: the delegate may transfer native token up to a cap (maxAmount),
 * with an optional initial amount and a rate limit (amountPerSecond) from a given startTime.
 * The caveats below enforce the rate and cap and restrict the delegation to simple transfers
 * (no calldata), so no contract calls are allowed.
 *
 * Caveats and enforcers
 * ---------------------
 * NativeTokenStreamingEnforcer: enforces the streaming terms (initial/max amount, rate, start
 * time) so that only allowed native-token transfers within the stream limits are permitted.
 * ExactCalldataEnforcer with calldata '0x': requires transaction calldata to be empty, so the
 * delegation can only send native value (simple transfer). No contract invocation is allowed.
 */

/**
 * Appends permission-specific caveats to the caveat builder.
 * @param options0 - The options object containing the permission and caveat builder.
 * @param options0.permission - The complete native token stream permission containing stream parameters.
 * @param options0.contracts - The contracts object containing enforcers.
 * @returns An array of Caveat objects with appended native token stream caveats.
 */
export async function createPermissionCaveats({
  permission,
  contracts,
}: {
  permission: PopulatedNativeTokenStreamPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

  // NativeTokenStreamingEnforcer: enforce initial/max amount, rate (amountPerSecond), and start time.
  const nativeTokenStreamingCaveat: Caveat = {
    enforcer: contracts.nativeTokenStreamingEnforcer,
    terms: createNativeTokenStreamingTerms({
      initialAmount: BigInt(initialAmount),
      maxAmount: BigInt(maxAmount),
      amountPerSecond: BigInt(amountPerSecond),
      startTime,
    }),
    args: '0x',
  };

  // ExactCalldataEnforcer: require empty calldata so only native value can be sent (no contract calls).
  const exactCalldataCaveat: Caveat = {
    enforcer: contracts.exactCalldataEnforcer,
    terms: createExactCalldataTerms({
      calldata: '0x',
    }),
    args: '0x',
  };

  return [nativeTokenStreamingCaveat, exactCalldataCaveat];
}
