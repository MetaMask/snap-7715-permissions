import {
  type Caveat,
  createERC20StreamingTerms,
  createValueLteTerms,
} from '@metamask/delegation-core';

import type { PopulatedErc20TokenStreamPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

/**
 * Appends permission-specific caveats to the caveat builder.
 *
 * @param options0 - The options object containing the permission and caveat builder.
 * @param options0.permission - The complete ERC20 token stream permission containing stream parameters.
 * @param options0.contracts - The contracts object containing enforcers.
 * @returns The modified caveat builder with appended ERC20 token stream caveats.
 */
export async function createPermissionCaveats({
  permission,
  contracts,
}: {
  permission: PopulatedErc20TokenStreamPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  const { initialAmount, maxAmount, amountPerSecond, startTime } =
    permission.data;

  const erc20StreamingCaveat: Caveat = {
    enforcer: contracts.erc20StreamingEnforcer,
    terms: createERC20StreamingTerms({
      tokenAddress: permission.data.tokenAddress,
      initialAmount: BigInt(initialAmount),
      maxAmount: BigInt(maxAmount),
      amountPerSecond: BigInt(amountPerSecond),
      startTime,
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

  return [erc20StreamingCaveat, valueLteCaveat];
}
