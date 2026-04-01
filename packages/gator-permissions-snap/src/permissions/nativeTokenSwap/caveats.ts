import {
  createArgsEqualityCheckTerms,
  createExactCalldataTerms,
  createRedeemerTerms,
} from '@metamask/delegation-core';
import type { Caveat, Hex } from '@metamask/delegation-core';
import { InternalError } from '@metamask/snaps-sdk';
import { bigIntToHex, hexToBigInt, numberToHex } from '@metamask/utils';

import type { PopulatedNativeTokenSwapPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

// abiEncode("Token-Whitelist-Enforced");
const WHITELIST_ENFORCED =
  '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000018546f6b656e2d57686974656c6973742d456e666f726365640000000000000000';

// abiEncode("Token-Whitelist-Not-Enforced");
const WHITELIST_NOT_ENFORCED =
  '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001c546f6b656e2d57686974656c6973742d4e6f742d456e666f7263656400000000';

export const PERIOD_DURATION =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

/**
 * Native token swap permission
 * ------------------------------
 * This permission allows a delegate to swap the grantor's native token for a specified token within an allowance.
 * The caveats below enforce the allowance and token policy.
 *
 * Caveats and enforcers
 * ---------------------
 * ArgsEqualityEnforcer: args specifying whether only whitelisted tokens are allowed.
 * NativeTokenPeriodTransferEnforcer: encodes a period duration of UINT256_MAX, to enforce a single period with
 * the configured native token allowance.
 * RedeemerEnforcer: only the swap adapter contract can redeem the permission.
 */

/**
 * Creates terms for a NativeTokenPeriodTransfer caveat that validates that native token (ETH) transfers
 * do not exceed a specified amount within a given time period. This differs from @metamask/delegation-core's
 * implementation in that it accepts periodDuration as bigint.
 *
 * @param terms - The terms for the NativeTokenPeriodTransfer caveat.
 * @param terms.periodAmount - The amount of native token that can be swapped.
 * @param terms.periodDuration - The duration of the time period.
 * @param terms.startDate - The start date of the time period.
 * @returns The terms as a 96-byte hex string (32 bytes for each parameter).
 * @throws Error if any of the numeric parameters are invalid.
 */
function createNativeTokenPeriodTransferTerms(terms: {
  periodAmount: bigint;
  periodDuration: bigint;
  startDate: number;
}): Hex {
  const { periodAmount, periodDuration, startDate } = terms;

  if (periodAmount <= 0n) {
    throw new Error('Invalid periodAmount: must be a positive number');
  }

  if (periodDuration <= 0) {
    throw new Error('Invalid periodDuration: must be a positive number');
  }

  if (startDate <= 0) {
    throw new Error('Invalid startDate: must be a positive number');
  }

  const periodAmountHex = bigIntToHex(periodAmount);
  const periodDurationHex = bigIntToHex(periodDuration);
  const startDateHex = numberToHex(startDate);

  return `0x${periodAmountHex}${periodDurationHex}${startDateHex}`;
}

/**
 * Builds caveats for a native-token-swap delegation.
 *
 * @param args - Caveat inputs.
 * @param args.permission - Populated swap permission.
 * @param args.contracts - Chain contracts; must include `tokenSwapAdapter` when supported.
 * @returns Caveats attached to the delegation.
 */
export async function createPermissionCaveats({
  permission,
  contracts,
}: {
  permission: PopulatedNativeTokenSwapPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> {
  const { allowance, whitelistedTokensOnly } = permission.data;

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

  const nativeTokenPeriodTransferCaveat: Caveat = {
    enforcer: contracts.nativeTokenPeriodTransferEnforcer,
    terms: createNativeTokenPeriodTransferTerms({
      periodAmount: hexToBigInt(allowance),
      periodDuration: PERIOD_DURATION,
      startDate: Math.floor(Date.now() / 1000),
    }),
    args: '0x',
  };

  const exactCalldataCaveat: Caveat = {
    enforcer: contracts.exactCalldataEnforcer,
    terms: createExactCalldataTerms({
      calldata: '0x',
    }),
    args: '0x',
  };

  const swapAdapterAddress = contracts.tokenSwapAdapter;

  if (swapAdapterAddress === undefined) {
    throw new InternalError(
      'Token swap adapter is not configured for this chain',
    );
  }

  const redeemerCaveat: Caveat = {
    enforcer: contracts.redeemerEnforcer,
    terms: createRedeemerTerms({
      redeemers: [swapAdapterAddress],
    }),
    args: '0x',
  };

  return [
    argsEqualityCaveat,
    nativeTokenPeriodTransferCaveat,
    exactCalldataCaveat,
    redeemerCaveat,
  ];
}
