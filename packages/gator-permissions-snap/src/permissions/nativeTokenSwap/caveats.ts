import {
  createArgsEqualityCheckTerms,
  createLimitedCallsTerms,
  createNativeTokenTransferAmountTerms,
  createRedeemerTerms,
} from '@metamask/delegation-core';
import type { Caveat } from '@metamask/delegation-core';
import { InternalError } from '@metamask/snaps-sdk';

import type { PopulatedNativeTokenSwapPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

// abiEncode("Token-Whitelist-Enforced");
const WHITELIST_ENFORCED =
  '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000018546f6b656e2d57686974656c6973742d456e666f726365640000000000000000';

// abiEncode("Token-Whitelist-Not-Enforced");
const WHITELIST_NOT_ENFORCED =
  '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001c546f6b656e2d57686974656c6973742d4e6f742d456e666f7263656400000000';

/**
 * Native token swap permission
 * ------------------------------
 * This permission allows a delegate to swap the grantor's native token for a specified token up to a cap.
 * The caveats below enforce the swap limit and token policy.
 *
 * Caveats and enforcers
 * ---------------------
 * ArgsEqualityEnforcer: args specifying whether only whitelisted tokens are allowed.
 * NativeTokenTransferAmountEnforcer: defines the max amount of native token that can be swapped.
 * RedeemerEnforcer: only the swap adapter contract can redeem the permission.
 */

/**
 * Builds caveats for a native-token-swap delegation.
 *
 * @param args - Caveat inputs.
 * @param args.permission - Populated swap permission.
 * @param args.contracts - Chain contracts; must include `nativeTokenSwapAdapter` when supported.
 * @returns Caveats attached to the delegation.
 */
export async function createPermissionCaveats({
  permission,
  contracts,
}: {
  permission: PopulatedNativeTokenSwapPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  const { maxNativeSwapAmount, whitelistedTokensOnly } = permission.data;

  const expectedArgs = whitelistedTokensOnly
    ? WHITELIST_ENFORCED
    : WHITELIST_NOT_ENFORCED;

  const argsEqualityCaveat: Caveat = {
    enforcer: contracts.argsEqualityEnforcer,
    terms: createArgsEqualityCheckTerms({
      args: expectedArgs,
    }),
    args: expectedArgs,
  };

  const nativeTokenTransferAmountCaveat: Caveat = {
    enforcer: contracts.nativeTokenTransferAmountEnforcer,
    terms: createNativeTokenTransferAmountTerms({
      maxAmount: BigInt(maxNativeSwapAmount),
    }),
    args: '0x',
  };

  const swapAdapterAddress = contracts.nativeTokenSwapAdapter;

  if (swapAdapterAddress === undefined) {
    throw new InternalError(
      'Native token swap adapter is not configured for this chain',
    );
  }

  const redeemerCaveat: Caveat = {
    enforcer: contracts.redeemerEnforcer,
    terms: createRedeemerTerms({
      redeemers: [swapAdapterAddress],
    }),
    args: '0x',
  };

  const limitedCallsCaveat: Caveat = {
    enforcer: contracts.limitedCallsEnforcer,
    terms: createLimitedCallsTerms({
      limit: 1,
    }),
    args: '0x',
  };

  return [
    argsEqualityCaveat,
    nativeTokenTransferAmountCaveat,
    redeemerCaveat,
    limitedCallsCaveat,
  ];
}
