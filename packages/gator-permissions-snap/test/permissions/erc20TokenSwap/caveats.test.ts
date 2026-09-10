import { describe, expect, it } from '@jest/globals';
import {
  BalanceChangeType,
  decodeAllowedMethodsTerms,
  decodeAllowedTargetsTerms,
  decodeERC20BalanceChangeTerms,
  decodeLimitedCallsTerms,
  decodeValueLteTerms,
} from '@metamask/delegation-core';
import { bigIntToHex } from '@metamask/utils';

import { getChainMetadata } from '../../../src/core/chainMetadata';
import {
  createPermissionCaveats,
  MAX_REDEMPTIONS,
} from '../../../src/permissions/erc20TokenSwap/caveats';
import type { PopulatedErc20TokenSwapPermission } from '../../../src/permissions/erc20TokenSwap/types';

const RECIPIENT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const SPEND_TOKEN = '0x1111111111111111111111111111111111111111';
const RECEIVE_TOKEN = '0x2222222222222222222222222222222222222222';
const ROUTER = '0x3333333333333333333333333333333333333333';
const TRANSFER_SELECTOR = '0xa9059cbb';

const MAX_SPEND_AMOUNT = 40_000n * 10n ** 18n;
const MIN_RECEIVE_AMOUNT = 36_427_610_000n;

// 1 byte flag + 20 bytes token + 20 bytes recipient + 32 bytes amount
const ERC20_BALANCE_CHANGE_TERMS_HEX_LENGTH = 2 + 73 * 2;

const { contracts } = getChainMetadata({ chainId: 11155111 });

const permission: PopulatedErc20TokenSwapPermission = {
  type: 'erc20-token-swap',
  isAdjustmentAllowed: true,
  data: {
    justification: 'Exit the position if an exploit is detected',
    spend: {
      tokenAddress: SPEND_TOKEN,
      maxAmount: bigIntToHex(MAX_SPEND_AMOUNT),
    },
    receive: {
      tokenAddress: RECEIVE_TOKEN,
      minAmount: bigIntToHex(MIN_RECEIVE_AMOUNT),
    },
    via: {
      targets: [ROUTER],
      selectors: ['0xdeadbeef', 'transfer(address,uint256)'],
    },
    recipient: RECIPIENT,
  },
};

describe('erc20TokenSwap:caveats', () => {
  describe('createPermissionCaveats()', () => {
    it('creates the six swap caveats in order', () => {
      const caveats = createPermissionCaveats({ permission, contracts });

      expect(caveats.map((caveat) => caveat.enforcer)).toStrictEqual([
        contracts.allowedTargetsEnforcer,
        contracts.allowedMethodsEnforcer,
        contracts.valueLteEnforcer,
        contracts.erc20BalanceChangeEnforcer,
        contracts.erc20BalanceChangeEnforcer,
        contracts.limitedCallsEnforcer,
      ]);
      expect(caveats.every((caveat) => caveat.args === '0x')).toBe(true);
    });

    it('restricts calls to the allow-listed targets and selectors', () => {
      const [allowedTargets, allowedMethods] = createPermissionCaveats({
        permission,
        contracts,
      });

      expect(
        decodeAllowedTargetsTerms(allowedTargets?.terms ?? '0x').targets.map(
          (target) => target.toLowerCase(),
        ),
      ).toStrictEqual([ROUTER.toLowerCase()]);

      expect(
        decodeAllowedMethodsTerms(allowedMethods?.terms ?? '0x').selectors.map(
          (selector) => selector.toLowerCase(),
        ),
      ).toStrictEqual(['0xdeadbeef', TRANSFER_SELECTOR]);
    });

    it('disallows sending native value with the call', () => {
      const [, , valueLte] = createPermissionCaveats({ permission, contracts });

      expect(decodeValueLteTerms(valueLte?.terms ?? '0x')).toStrictEqual({
        maxValue: 0n,
      });
    });

    it('requires the receive token balance of the recipient to increase by at least minAmount', () => {
      const [, , , receiveIncrease] = createPermissionCaveats({
        permission,
        contracts,
      });

      expect(receiveIncrease?.terms).toHaveLength(
        ERC20_BALANCE_CHANGE_TERMS_HEX_LENGTH,
      );
      // The direction flag is the first byte of the packed terms.
      expect(receiveIncrease?.terms.slice(0, 4)).toBe('0x00');

      const decoded = decodeERC20BalanceChangeTerms(
        receiveIncrease?.terms ?? '0x',
      );
      expect(decoded.changeType).toBe(BalanceChangeType.Increase);
      expect(decoded.tokenAddress.toLowerCase()).toBe(
        RECEIVE_TOKEN.toLowerCase(),
      );
      expect(decoded.recipient.toLowerCase()).toBe(RECIPIENT.toLowerCase());
      expect(decoded.balance).toBe(MIN_RECEIVE_AMOUNT);
    });

    it('caps the spend token balance decrease of the recipient at maxAmount', () => {
      const [, , , , spendDecrease] = createPermissionCaveats({
        permission,
        contracts,
      });

      expect(spendDecrease?.terms.slice(0, 4)).toBe('0x01');

      const decoded = decodeERC20BalanceChangeTerms(
        spendDecrease?.terms ?? '0x',
      );
      expect(decoded.changeType).toBe(BalanceChangeType.Decrease);
      expect(decoded.tokenAddress.toLowerCase()).toBe(
        SPEND_TOKEN.toLowerCase(),
      );
      expect(decoded.recipient.toLowerCase()).toBe(RECIPIENT.toLowerCase());
      expect(decoded.balance).toBe(MAX_SPEND_AMOUNT);
    });

    it('limits the delegation to a single redemption', () => {
      const [, , , , , limitedCalls] = createPermissionCaveats({
        permission,
        contracts,
      });

      expect(MAX_REDEMPTIONS).toBe(1);
      expect(
        decodeLimitedCallsTerms(limitedCalls?.terms ?? '0x'),
      ).toStrictEqual({ limit: 1 });
    });

    it('throws when the max spend amount is zero', () => {
      const zeroSpend: PopulatedErc20TokenSwapPermission = {
        ...permission,
        data: {
          ...permission.data,
          spend: { ...permission.data.spend, maxAmount: '0x0' },
        },
      };

      expect(() =>
        createPermissionCaveats({ permission: zeroSpend, contracts }),
      ).toThrow('spend.maxAmount must be a positive number');
    });

    it('throws when the min receive amount is zero', () => {
      const zeroReceive: PopulatedErc20TokenSwapPermission = {
        ...permission,
        data: {
          ...permission.data,
          receive: { ...permission.data.receive, minAmount: '0x0' },
        },
      };

      expect(() =>
        createPermissionCaveats({ permission: zeroReceive, contracts }),
      ).toThrow('receive.minAmount must be a positive number');
    });
  });
});
