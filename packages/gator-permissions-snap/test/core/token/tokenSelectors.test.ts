import { describe, expect, it, jest } from '@jest/globals';
import { InternalError } from '@metamask/snaps-sdk';
import type { CaipAssetType } from '@metamask/snaps-sdk';

import {
  collectTokenCaip19s,
  getTokenDecimals,
  primaryTokenCaip19Selector,
  resolveModuleTokenCaip19s,
} from '../../../src/core/token/tokenSelectors';
import {
  createMockTokenMetadataCoordinator,
  createTestBaseContext,
  createTestTokenContext,
} from '../../testContext';

const erc20Caip19 =
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType;
const nativeCaip19 = 'eip155:1/slip44:60' as CaipAssetType;

const selectErc20 = (): CaipAssetType => erc20Caip19;
const selectNative = (): CaipAssetType => nativeCaip19;
const selectUndefined = (): undefined => undefined;

describe('tokenSelectors', () => {
  describe('collectTokenCaip19s', () => {
    it('deduplicates and omits undefined selector results', () => {
      const context = createTestBaseContext();

      const result = collectTokenCaip19s(context, [
        selectErc20,
        selectUndefined,
        selectErc20,
        selectNative,
      ]);

      expect(result).toStrictEqual([erc20Caip19, nativeCaip19]);
    });
  });

  describe('resolveModuleTokenCaip19s', () => {
    it('returns collected tokens and no balance when balance is omitted', () => {
      const context = createTestTokenContext();

      const result = resolveModuleTokenCaip19s({
        context,
        tokenCaip19s: [primaryTokenCaip19Selector],
      });

      expect(result).toStrictEqual({
        tokenCaip19s: [context.primaryTokenCaip19],
        balanceCaip19: undefined,
      });
    });

    it('returns the balance token when it is in tokenCaip19s', () => {
      const context = createTestTokenContext();

      const result = resolveModuleTokenCaip19s({
        context,
        tokenCaip19s: [primaryTokenCaip19Selector],
        balanceTokenCaip19: primaryTokenCaip19Selector,
      });

      expect(result).toStrictEqual({
        tokenCaip19s: [context.primaryTokenCaip19],
        balanceCaip19: context.primaryTokenCaip19,
      });
    });

    it('throws when the balance token is not in tokenCaip19s', () => {
      const context = createTestBaseContext();
      const resolveMismatchedBalance = (): ReturnType<
        typeof resolveModuleTokenCaip19s
      > =>
        resolveModuleTokenCaip19s({
          context,
          tokenCaip19s: [selectErc20],
          balanceTokenCaip19: selectNative,
        });

      expect(resolveMismatchedBalance).toThrow(InternalError);
      expect(resolveMismatchedBalance).toThrow(
        `balanceTokenCaip19 "${nativeCaip19}" is not in tokenCaip19s [${erc20Caip19}]`,
      );
    });

    it('allows an empty token list when no balance token is selected', () => {
      const context = createTestBaseContext();

      expect(
        resolveModuleTokenCaip19s({
          context,
          tokenCaip19s: [],
        }),
      ).toStrictEqual({
        tokenCaip19s: [],
        balanceCaip19: undefined,
      });
    });
  });

  describe('getTokenDecimals', () => {
    it('returns decimals from coordinator metadata', () => {
      const coordinator = createMockTokenMetadataCoordinator({
        metadata: {
          symbol: 'USDC',
          decimals: 6,
          iconDataBase64: null,
        },
      });

      expect(getTokenDecimals(coordinator, erc20Caip19)).toBe(6);
    });

    it('returns undefined when the asset or metadata is missing', () => {
      const coordinator = createMockTokenMetadataCoordinator();
      jest.mocked(coordinator.getMetadata).mockReturnValue(undefined);

      expect(getTokenDecimals(coordinator, undefined)).toBeUndefined();
      expect(getTokenDecimals(coordinator, erc20Caip19)).toBeUndefined();
    });
  });
});
