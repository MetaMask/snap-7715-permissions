import type { Caveat } from '@metamask/delegation-core';

import type { PopulatedNativeTokenSwapPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

/**
 * Native token swap permission currently attaches no delegation caveats.
 * Callers should treat swap limits and token policy as off-chain / wallet semantics until
 * matching enforcers exist.
 */

/**
 * Returns no caveats for native token swap.
 * @returns Empty caveat list.
 */
export async function createPermissionCaveats(_: {
  permission: PopulatedNativeTokenSwapPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  return [];
}
