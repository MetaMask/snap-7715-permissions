import type { Caveat } from '@metamask/delegation-core';
import {
  BalanceChangeType,
  createAllowedMethodsTerms,
  createAllowedTargetsTerms,
  createERC20BalanceChangeTerms,
  createLimitedCallsTerms,
  createValueLteTerms,
} from '@metamask/delegation-core';
import { InvalidInputError } from '@metamask/snaps-sdk';
import { hexToBigInt } from '@metamask/utils';

import { toFourByteSelector } from './selectors';
import type { PopulatedErc20TokenSwapPermission } from './types';
import type { DelegationContracts } from '../../core/chainMetadata';

/**
 * The permission is single-shot: one redemption exits the position.
 */
export const MAX_REDEMPTIONS = 1;

/**
 * ERC-20 token swap permission
 * ----------------------------
 * This permission lets a delegate call an allow-listed contract function that
 * converts a bounded amount of one ERC-20 token into at least a stated amount
 * of another ERC-20 token, delivered to the granting account. The outcome is
 * what is enforced; the calldata is left free apart from target and selector.
 *
 * Caveats and enforcers
 * ---------------------
 * AllowedTargetsEnforcer: the delegate may only call the listed contracts.
 * AllowedMethodsEnforcer: the delegate may only call the listed functions.
 * ValueLteEnforcer: no native token may be sent with the call.
 * ERC20BalanceChangeEnforcer (increase): the granting account's balance of the
 * received token must grow by at least `receive.minAmount`.
 * ERC20BalanceChangeEnforcer (decrease): the granting account's balance of the
 * spent token may shrink by at most `spend.maxAmount`.
 * LimitedCallsEnforcer: the delegation may be redeemed once.
 *
 * The timestamp (expiry rule), redeemer (redeemer rule) and nonce caveats are
 * appended by the core grant pipeline.
 *
 * This factory is a local stand-in for a `createErc20TokenSwapCaveats` export
 * from `@metamask/7715-permission-types`; once that package ships the caveat
 * constructor and the matching decoder config, this file can be replaced by an
 * import, as was done for the other permission types.
 */

/**
 * Creates the permission-specific caveats for an ERC-20 token swap delegation.
 * @param args - The options object containing the permission and contracts.
 * @param args.permission - The populated ERC-20 token swap permission.
 * @param args.contracts - The delegation framework contracts for the chain.
 * @returns The permission caveats.
 * @throws {InvalidInputError} If an amount is zero.
 */
export function createPermissionCaveats({
  permission,
  contracts,
}: {
  permission: PopulatedErc20TokenSwapPermission;
  contracts: DelegationContracts;
}): Caveat[] {
  const { spend, receive, via, recipient } = permission.data;

  const maxSpendAmount = hexToBigInt(spend.maxAmount);
  const minReceiveAmount = hexToBigInt(receive.minAmount);

  if (maxSpendAmount === 0n) {
    throw new InvalidInputError(
      'Invalid erc20-token-swap permission: spend.maxAmount must be a positive number.',
    );
  }

  if (minReceiveAmount === 0n) {
    throw new InvalidInputError(
      'Invalid erc20-token-swap permission: receive.minAmount must be a positive number.',
    );
  }

  const allowedTargetsCaveat: Caveat = {
    enforcer: contracts.allowedTargetsEnforcer,
    terms: createAllowedTargetsTerms({ targets: via.targets }),
    args: '0x',
  };

  const allowedMethodsCaveat: Caveat = {
    enforcer: contracts.allowedMethodsEnforcer,
    terms: createAllowedMethodsTerms({
      selectors: via.selectors.map(toFourByteSelector),
    }),
    args: '0x',
  };

  const valueLteCaveat: Caveat = {
    enforcer: contracts.valueLteEnforcer,
    terms: createValueLteTerms({ maxValue: 0n }),
    args: '0x',
  };

  const receiveIncreaseCaveat: Caveat = {
    enforcer: contracts.erc20BalanceChangeEnforcer,
    terms: createERC20BalanceChangeTerms({
      tokenAddress: receive.tokenAddress,
      recipient,
      balance: minReceiveAmount,
      changeType: BalanceChangeType.Increase,
    }),
    args: '0x',
  };

  const spendDecreaseCaveat: Caveat = {
    enforcer: contracts.erc20BalanceChangeEnforcer,
    terms: createERC20BalanceChangeTerms({
      tokenAddress: spend.tokenAddress,
      recipient,
      balance: maxSpendAmount,
      changeType: BalanceChangeType.Decrease,
    }),
    args: '0x',
  };

  const limitedCallsCaveat: Caveat = {
    enforcer: contracts.limitedCallsEnforcer,
    terms: createLimitedCallsTerms({ limit: MAX_REDEMPTIONS }),
    args: '0x',
  };

  return [
    allowedTargetsCaveat,
    allowedMethodsCaveat,
    valueLteCaveat,
    receiveIncreaseCaveat,
    spendDecreaseCaveat,
    limitedCallsCaveat,
  ];
}
