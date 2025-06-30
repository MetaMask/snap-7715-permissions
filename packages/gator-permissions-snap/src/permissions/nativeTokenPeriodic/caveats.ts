import {
  type Caveat,
  createExactCalldataTerms,
  createNativeTokenPeriodTransferTerms,
} from '@metamask/delegation-core';

import type { DelegationContracts } from 'src/core/delegationContracts';

import type { PopulatedNativeTokenPeriodicPermission } from './types';

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

  const nativeTokenPeriodTransferCaveat: Caveat = {
    enforcer: contracts.enforcers.NativeTokenPeriodicTransferEnforcer,
    terms: createNativeTokenPeriodTransferTerms({
      periodAmount: BigInt(periodAmount),
      periodDuration,
      startDate: startTime,
    }),
    args: '0x',
  };

  const exactCalldataCaveat: Caveat = {
    enforcer: contracts.enforcers.ExactCalldataEnforcer,
    terms: createExactCalldataTerms({
      callData: '0x',
    }),
    args: '0x',
  };

  return [nativeTokenPeriodTransferCaveat, exactCalldataCaveat];
}
