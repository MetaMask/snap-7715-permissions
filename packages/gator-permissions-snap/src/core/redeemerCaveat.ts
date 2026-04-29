import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import type { Caveat, Hex } from '@metamask/delegation-core';
import { createRedeemerTerms } from '@metamask/delegation-core';

import type { DelegationContracts } from './chainMetadata';

/**
 * Appends a RedeemerEnforcer caveat when the permission request includes a redeemer rule.
 *
 * @param options - Arguments for appending the caveat.
 * @param options.rules - Resolved permission request rules from the grant flow.
 * @param options.contracts - Delegation enforcer addresses for the active chain.
 * @param options.caveats - Mutable caveat array to append to.
 */
export function appendRedeemerCaveatIfPresent({
  rules,
  contracts,
  caveats,
}: {
  rules: PermissionRequest['rules'];
  contracts: DelegationContracts;
  caveats: Caveat[];
}): void {
  const redeemerRule = rules?.find(
    (rule) => extractDescriptorName(rule.type) === 'redeemer',
  );
  const rawAddresses = redeemerRule?.data?.addresses as Hex[] | undefined;
  if (!Array.isArray(rawAddresses) || rawAddresses.length === 0) {
    return;
  }

  caveats.push({
    enforcer: contracts.redeemerEnforcer,
    terms: createRedeemerTerms({ redeemers: rawAddresses }),
    args: '0x',
  });
}
