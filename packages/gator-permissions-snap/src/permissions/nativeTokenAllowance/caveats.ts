import {
  createExactCalldataTerms,
  createNativeTokenPeriodTransferTerms,
} from '@metamask/delegation-core';
import type { Caveat } from '@metamask/delegation-core';

import type { DelegationContracts } from '../../core/chainMetadata';
import { PERIOD_TRANSFER_PERIOD_DURATION_UINT256_MAX } from '../shared';
import type { PopulatedNativeTokenAllowancePermission } from './types';

/**
 * Native token allowance uses NativeTokenPeriodTransferEnforcer with max uint256 period
 * duration, plus ExactCalldataEnforcer (empty calldata) like native-token-periodic.
 */

/**
 * Builds delegation caveats for native-token-allowance.
 * @param args - The options object containing the permission and contracts.
 * @param args.permission - Populated permission.
 * @param args.contracts - Chain enforcer addresses.
 * @returns Caveats for the delegation.
 */
export async function createPermissionCaveats({
  permission,
  contracts,
}: {
  permission: PopulatedNativeTokenAllowancePermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  const { allowanceAmount, startTime } = permission.data;

  const nativeTokenPeriodTransferCaveat: Caveat = {
    enforcer: contracts.nativeTokenPeriodTransferEnforcer,
    terms: createNativeTokenPeriodTransferTerms({
      periodAmount: BigInt(allowanceAmount),
      // @metamask/delegation-core uses toHexString to encode period duration, which accepts bigint. We
      // should update delegation-core to accept bigint as well as number, but we just do a type
      // assertion for now.
      periodDuration:
        PERIOD_TRANSFER_PERIOD_DURATION_UINT256_MAX as unknown as number,
      startDate: startTime,
    }),
    args: '0x',
  };

  const exactCalldataCaveat: Caveat = {
    enforcer: contracts.exactCalldataEnforcer,
    terms: createExactCalldataTerms({
      calldata: '0x',
    }),
    args: '0x',
  };

  return [nativeTokenPeriodTransferCaveat, exactCalldataCaveat];
}
