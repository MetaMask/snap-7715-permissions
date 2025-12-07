import {
  createValueLteTerms,
  createAllowedCalldataTerms,
  type Caveat,
} from '@metamask/delegation-core';

import type { PopulatedErc20TokenRevocationPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

/**
 * Appends permission-specific caveats for ERC20 approval revocation.
 * @param args - The options object containing the permission and caveat builder.
 * @param args.permission - The complete ERC20 token revocation permission containing revocation parameters.
 * @param args.contracts - The contracts to use for the caveats.
 * @returns The modified caveat builder with appended ERC20 token revocation caveats.
 */
export async function createPermissionCaveats({
  contracts,
}: {
  permission: PopulatedErc20TokenRevocationPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  // keccak("approve(address,uint256)")
  const approveFunctionSelector = '0x095ea7b3';
  const zeroAsUInt256 =
    '0x0000000000000000000000000000000000000000000000000000000000000000';

  const functionSelectorCaveat: Caveat = {
    enforcer: contracts.allowedCalldataEnforcer,
    terms: createAllowedCalldataTerms({
      startIndex: 0,
      value: approveFunctionSelector,
    }),
    args: '0x',
  };

  const amountCaveat: Caveat = {
    enforcer: contracts.allowedCalldataEnforcer,
    terms: createAllowedCalldataTerms({
      startIndex: 36,
      value: zeroAsUInt256,
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

  return [functionSelectorCaveat, amountCaveat, valueLteCaveat];
}
