import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';
import type { Caveat } from '@metamask/delegation-core';
import { createTimestampTerms } from '@metamask/delegation-core';

import type { DelegationContracts } from './chainMetadata';

/**
 * Appends a TimestampEnforcer caveat when the permission request includes an expiry rule.
 *
 * @param options - Arguments for appending the caveat.
 * @param options.rules - Resolved permission request rules from the grant flow.
 * @param options.contracts - Delegation enforcer addresses for the active chain.
 * @param options.caveats - Mutable caveat array to append to.
 */
export function appendExpiryCaveatIfPresent({
  rules,
  contracts,
  caveats,
}: {
  rules: PermissionRequest['rules'];
  contracts: DelegationContracts;
  caveats: Caveat[];
}): void {
  const expiryRule = rules?.find(
    (rule) => extractDescriptorName(rule.type) === 'expiry',
  );
  if (!expiryRule) {
    return;
  }

  const timestampAfterThreshold = 0;
  const timestampBeforeThreshold = expiryRule.data.timestamp;

  caveats.push({
    enforcer: contracts.timestampEnforcer,
    terms: createTimestampTerms({
      afterThreshold: timestampAfterThreshold,
      beforeThreshold: timestampBeforeThreshold,
    }),
    args: '0x',
  });
}
