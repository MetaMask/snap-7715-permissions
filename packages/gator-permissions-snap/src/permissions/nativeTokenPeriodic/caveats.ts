import {
  createExactCalldataTerms,
  createNativeTokenPeriodTransferTerms,
} from '@metamask/delegation-core';
import type { Caveat } from '@metamask/delegation-core';

import type { PopulatedNativeTokenPeriodicPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

/**
 * Native token periodic permission
 * --------------------------------
 * This permission allows a delegate to transfer a fixed amount of the chain’s native token
 * (e.g. ETH) at regular intervals: the delegate may transfer up to periodAmount per periodDuration
 * (e.g. per day), starting at startTime. The caveats below enforce the period and cap and restrict
 * the delegation to simple transfers (no calldata), so no contract calls are allowed.
 *
 * Caveats and enforcers
 * ---------------------
 * NativeTokenPeriodTransferEnforcer: enforces the periodic terms (period amount, period duration,
 * start date) so that only allowed native-token transfers within the periodic limits are permitted.
 * ExactCalldataEnforcer with calldata '0x': requires transaction calldata to be empty, so the
 * delegation can only send native value (simple transfer). No contract invocation is allowed.
 */

/**
 * Appends permission-specific caveats to the caveat builder.
 * @param options0 - The options object containing the permission and caveat builder.
 * @param options0.permission - The complete native token periodic permission containing periodic parameters.
 * @param options0.contracts - The contracts object containing enforcers.
 * @returns The modified caveat builder with appended native token periodic caveats.
 */
export async function createPermissionCaveats({
  permission,
  contracts,
}: {
  permission: PopulatedNativeTokenPeriodicPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  const { periodAmount, periodDuration, startTime } = permission.data;

  // NativeTokenPeriodTransferEnforcer: enforce period amount, period duration, and start date.
  const nativeTokenPeriodTransferCaveat: Caveat = {
    enforcer: contracts.nativeTokenPeriodTransferEnforcer,
    terms: createNativeTokenPeriodTransferTerms({
      periodAmount: BigInt(periodAmount),
      periodDuration,
      startDate: startTime,
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

  return [nativeTokenPeriodTransferCaveat, exactCalldataCaveat];
}
