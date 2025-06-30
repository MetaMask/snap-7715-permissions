import type { DelegationContracts } from '../../core/delegationContracts';

import type { PopulatedErc20TokenPeriodicPermission } from './types';
import {
  Caveat,
  createERC20TokenPeriodTransferTerms,
  createValueLteTerms,
} from '@metamask/delegation-core';

/**
 * Appends permission-specific caveats to the caveat builder.
 * @param options0 - The options object containing the permission and caveat builder.
 * @param options0.permission - The complete ERC20 token periodic permission containing periodic parameters.
 * @param options0.caveatBuilder - The core caveat builder to append caveats to.
 * @returns The modified caveat builder with appended ERC20 token periodic caveats.
 */
export async function createPermissionCaveats({
  permission,
  contracts,
}: {
  permission: PopulatedErc20TokenPeriodicPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  const { periodAmount, periodDuration, startTime, tokenAddress } =
    permission.data;

  const erc20PeriodCaveat: Caveat = {
    enforcer: contracts.enforcers.ERC20PeriodicTransferEnforcer,
    terms: createERC20TokenPeriodTransferTerms({
      tokenAddress,
      periodAmount: BigInt(periodAmount),
      periodDuration,
      startDate: startTime,
    }),
    args: '0x',
  };

  const valueLteCaveat: Caveat = {
    enforcer: contracts.enforcers.ValueLteEnforcer,
    terms: createValueLteTerms({
      maxValue: 0n,
    }),
    args: '0x',
  };

  return [erc20PeriodCaveat, valueLteCaveat];
}
