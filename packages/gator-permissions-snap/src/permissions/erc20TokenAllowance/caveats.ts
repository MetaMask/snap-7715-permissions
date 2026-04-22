import type { Caveat } from '@metamask/delegation-core';
import {
  createERC20TokenPeriodTransferTerms,
  createValueLteTerms,
} from '@metamask/delegation-core';

import type { DelegationContracts } from '../../core/chainMetadata';
import { PERIOD_TRANSFER_PERIOD_DURATION_UINT256_MAX } from '../shared';
import type { PopulatedErc20TokenAllowancePermission } from './types';

/**
 * ERC-20 token allowance uses ERC20PeriodTransferEnforcer with max uint256 period duration
 * (unbounded on-chain period). Optional `expiry` on the request adds a timestamp enforcer
 * like other permissions. ValueLteEnforcer forbids native value.
 */

/**
 * Builds delegation caveats for erc20-token-allowance.
 * @param args - The options object containing the permission and contracts.
 * @param args.permission - Populated permission.
 * @param args.contracts - Chain enforcer addresses.
 * @returns Caveats for the delegation.
 */
export async function createPermissionCaveats({
  permission,
  contracts,
}: {
  permission: PopulatedErc20TokenAllowancePermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  const { allowanceAmount, startTime, tokenAddress } = permission.data;

  const erc20PeriodCaveat: Caveat = {
    enforcer: contracts.erc20PeriodTransferEnforcer,
    terms: createERC20TokenPeriodTransferTerms({
      tokenAddress,
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

  const valueLteCaveat: Caveat = {
    enforcer: contracts.valueLteEnforcer,
    terms: createValueLteTerms({
      maxValue: 0n,
    }),
    args: '0x',
  };

  return [erc20PeriodCaveat, valueLteCaveat];
}
