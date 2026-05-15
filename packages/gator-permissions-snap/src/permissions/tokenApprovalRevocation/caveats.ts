import { ZERO_ADDRESS } from '@metamask/7715-permissions-shared/types';
import type { Caveat } from '@metamask/delegation-core';
import { createApprovalRevocationTerms } from '@metamask/delegation-core';
import { InvalidInputError } from '@metamask/snaps-sdk';

import type { PopulatedTokenApprovalRevocationPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

/**
 * Appends permission-specific caveats for token approval revocation.
 * @param args - The options object containing the permission and caveat builder.
 * @param args.permission - The complete token approval revocation permission.
 * @param args.contracts - The contracts to use for the caveats.
 * @returns The permission caveats.
 */
export async function createPermissionCaveats({
  permission,
  contracts,
}: {
  permission: PopulatedTokenApprovalRevocationPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  if (contracts.approvalRevocationEnforcer === ZERO_ADDRESS) {
    throw new InvalidInputError(
      'ApprovalRevocationEnforcer address is not configured.',
    );
  }

  const approvalRevocationCaveat: Caveat = {
    enforcer: contracts.approvalRevocationEnforcer,
    terms: createApprovalRevocationTerms(permission.data),
    args: '0x',
  };

  return [approvalRevocationCaveat];
}
