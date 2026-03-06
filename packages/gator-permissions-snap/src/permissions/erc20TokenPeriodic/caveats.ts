import type { Caveat } from '@metamask/delegation-core';
import {
  createERC20TokenPeriodTransferTerms,
  createValueLteTerms,
} from '@metamask/delegation-core';

import type { PopulatedErc20TokenPeriodicPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

/**
 * ERC-20 token periodic permission
 * --------------------------------
 * This permission allows a delegate to transfer a fixed amount of an ERC-20 token at regular
 * intervals: the delegate may transfer up to periodAmount of the specified token per periodDuration
 * (e.g. per day), starting at startTime. The caveats below enforce the period and cap and forbid
 * sending native value with the delegation.
 *
 * Caveats and enforcers
 * ---------------------
 * ERC20PeriodTransferEnforcer: enforces the periodic terms (token, period amount, period duration,
 * start date) so that only allowed ERC-20 transfers within the periodic limits are permitted.
 * ValueLteEnforcer: caps native value at zero so the delegation cannot send ETH/native token
 * (only the specified ERC-20 token is transferred periodically).
 */

/**
 * Appends permission-specific caveats to the caveat builder.
 * @param args - The options object containing the permission and caveat builder.
 * @param args.permission - The complete ERC20 token periodic permission containing periodic parameters.
 * @param args.contracts - The contracts to use for the caveats.
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

  // ERC20PeriodTransferEnforcer: enforce token address, period amount, period duration, and start date.
  const erc20PeriodCaveat: Caveat = {
    enforcer: contracts.erc20PeriodTransferEnforcer,
    terms: createERC20TokenPeriodTransferTerms({
      tokenAddress,
      periodAmount: BigInt(periodAmount),
      periodDuration,
      startDate: startTime,
    }),
    args: '0x',
  };

  // ValueLteEnforcer: allow no native value (e.g. msg.value must be 0).
  const valueLteCaveat: Caveat = {
    enforcer: contracts.valueLteEnforcer,
    terms: createValueLteTerms({
      maxValue: 0n,
    }),
    args: '0x',
  };

  return [erc20PeriodCaveat, valueLteCaveat];
}
