import { jest } from '@jest/globals';
import type { CaipAssetType } from '@metamask/snaps-sdk';

import type { TokenMetadataCoordinator } from '../src/core/coordinators/TokenMetadataCoordinator';
import type {
  BaseContext,
  ContextWithPrimaryToken,
  ResolvedTokenBalance,
  ResolvedTokenMetadata,
} from '../src/core/types';

/**
 * Builds a minimal base context for tests.
 * @param overrides - Optional context field overrides.
 * @returns A test base context.
 */
export function createTestBaseContext(
  overrides: Partial<BaseContext> = {},
): BaseContext {
  return {
    expiry: undefined,
    isAdjustmentAllowed: true,
    justification: 'test justification',
    accountAddressCaip10: 'eip155:1:0x1234567890123456789012345678901234567890',
    ...overrides,
  };
}

/**
 * Builds a test context with a primary token reference.
 * @param overrides - Optional context field overrides.
 * @returns A test context with primaryTokenCaip19.
 */
export function createTestTokenContext(
  overrides: Partial<BaseContext & ContextWithPrimaryToken> = {},
): BaseContext & ContextWithPrimaryToken {
  return {
    ...createTestBaseContext(),
    primaryTokenCaip19:
      'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType,
    ...overrides,
  };
}

/**
 * Builds a mock {@link TokenMetadataCoordinator} for tests.
 * @param options - Optional metadata and balance overrides.
 * @param options.metadata - Metadata returned by the mock coordinator.
 * @param options.balance - Balance returned by the mock coordinator.
 * @returns A coordinator mock with noop sync/onUpdate by default.
 */
export function createMockTokenMetadataCoordinator(options?: {
  metadata?: ResolvedTokenMetadata;
  balance?: ResolvedTokenBalance | undefined;
}): TokenMetadataCoordinator {
  const metadata: ResolvedTokenMetadata = options?.metadata ?? {
    symbol: 'ETH',
    decimals: 18,
    iconDataBase64: null,
  };
  const balance =
    options && 'balance' in options
      ? options.balance
      : { formatted: '1', fiat: '$1' };

  const coordinator = {
    getMetadata: jest.fn((_caip19: CaipAssetType) => metadata),
    getBalance: jest.fn((_caip19: CaipAssetType) => balance),
    onUpdate: jest.fn(),
    sync: jest.fn(),
    ensureMetadata: jest.fn(async () => metadata),
  };

  return coordinator as unknown as TokenMetadataCoordinator;
}
