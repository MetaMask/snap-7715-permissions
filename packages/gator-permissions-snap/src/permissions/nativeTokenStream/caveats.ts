import {
  type Caveat,
  createNativeTokenStreamingTerms,
  createExactCalldataTerms,
} from '@metamask/delegation-core';

import type { PopulatedNativeTokenStreamPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

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

  const nativeTokenStreamingCaveat: Caveat = {
    enforcer: contracts.enforcers.NativeTokenStreamingEnforcer,
    terms: createNativeTokenStreamingTerms({
      initialAmount: BigInt(initialAmount),
      maxAmount: BigInt(maxAmount),
      amountPerSecond: BigInt(amountPerSecond),
      startTime,
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

  return [nativeTokenStreamingCaveat, exactCalldataCaveat];
}
