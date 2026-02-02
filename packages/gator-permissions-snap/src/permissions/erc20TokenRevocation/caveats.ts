import {
  createValueLteTerms,
  createAllowedCalldataTerms,
} from '@metamask/delegation-core';
import type { Caveat } from '@metamask/delegation-core';

import type { PopulatedErc20TokenRevocationPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

/**
 * ERC-20 token revocation permission
 * ----------------------------------
 * This permission allows a delegate to revoke ERC-20 allowances only: it restricts calls to
 * approve(spender, 0) on any ERC-20 token and forbids sending native value. The caveats below
 * enforce that the delegated transaction is exactly a revocation and nothing else.
 *
 * ERC-20 approve calldata layout (ABI encoding)
 * --------------------------------------------
 * ERC-20 defines `approve(address spender, uint256 value)`. When ABI-encoded:
 * - bytes 0..3:   4-byte function selector = keccak256("approve(address,uint256)") = 0x095ea7b3
 * - bytes 4..35:  first arg (address spender) as 32-byte word (20-byte address right-aligned, 12 zero bytes prefix)
 * - bytes 36..67: second arg (uint256 value) as 32-byte word
 *
 * Caveats and AllowedCalldataEnforcer
 * -----------------------------------
 * AllowedCalldataEnforcer encodes terms as concat(uint256 startIndex | uint256 value). It enforces
 * that the calldata at startIndex matches the given value; the comparison length is the byte length
 * of value (so 4 bytes for the selector, 32 bytes for the amount). We use it to require the
 * function selector (startIndex 0) and the amount argument (startIndex 36); ValueLteEnforcer is
 * used separately to cap native value at zero.
 */

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
  // keccak256("approve(address,uint256)") - ERC-20 approve function selector
  const approveFunctionSelector = '0x095ea7b3';
  // Zero as a 32-byte uint256 (required for approve(..., 0) revocation)
  const zeroAsUInt256 =
    '0x0000000000000000000000000000000000000000000000000000000000000000';

  // AllowedCalldataEnforcer: require the 4-byte function selector to be approve(address,uint256).
  // startIndex 0 = selector at the start of calldata.
  const functionSelectorCaveat: Caveat = {
    enforcer: contracts.allowedCalldataEnforcer,
    terms: createAllowedCalldataTerms({
      startIndex: 0,
      value: approveFunctionSelector,
    }),
    args: '0x',
  };

  // AllowedCalldataEnforcer: require the amount (third ABI word) to be zero.
  // startIndex 36 = 4 bytes (selector) + 32 bytes (spender) = start of uint256 value argument.
  const amountCaveat: Caveat = {
    enforcer: contracts.allowedCalldataEnforcer,
    terms: createAllowedCalldataTerms({
      startIndex: 36,
      value: zeroAsUInt256,
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

  return [functionSelectorCaveat, amountCaveat, valueLteCaveat];
}
