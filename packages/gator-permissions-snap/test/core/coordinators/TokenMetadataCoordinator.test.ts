import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { CaipAssetType } from '@metamask/snaps-sdk';

import { TokenMetadataCoordinator } from '../../../src/core/coordinators/TokenMetadataCoordinator';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';
import type { TokenPricesService } from '../../../src/services/tokenPricesService';

describe('TokenMetadataCoordinator', () => {
  const caip19 = 'eip155:1/slip44:60' as CaipAssetType;
  const accountCaip10 = 'eip155:1:0x1234567890123456789012345678901234567890';

  let mockMetadataService: jest.Mocked<
    Pick<
      TokenMetadataService,
      'getTokenBalanceAndMetadata' | 'fetchIconDataAsBase64'
    >
  >;
  let mockPricesService: jest.Mocked<
    Pick<TokenPricesService, 'getCryptoToFiatConversion'>
  >;

  const createCoordinator = (): TokenMetadataCoordinator =>
    new TokenMetadataCoordinator({
      tokenMetadataService:
        mockMetadataService as unknown as TokenMetadataService,
      tokenPricesService: mockPricesService as unknown as TokenPricesService,
    });

  beforeEach(() => {
    mockMetadataService = {
      getTokenBalanceAndMetadata: jest
        .fn<TokenMetadataService['getTokenBalanceAndMetadata']>()
        .mockResolvedValue({
          balance: 1000n,
          decimals: 18,
          symbol: 'ETH',
          iconUrl: undefined,
        }),
      fetchIconDataAsBase64: jest
        .fn<TokenMetadataService['fetchIconDataAsBase64']>()
        .mockResolvedValue({
          ok: false as const,
          reason: 'Icon URL not provided',
        }),
    };

    mockPricesService = {
      getCryptoToFiatConversion: jest
        .fn<TokenPricesService['getCryptoToFiatConversion']>()
        .mockResolvedValue('$1'),
    };
  });

  it('returns metadata after ensureMetadata', async () => {
    const coordinator = createCoordinator();

    const metadata = await coordinator.ensureMetadata({
      caip19,
      accountCaip10,
    });

    expect(metadata.symbol).toBe('ETH');
    expect(coordinator.getMetadata(caip19)?.decimals).toBe(18);
  });

  it('rejects ensureMetadata when metadata fetch fails', async () => {
    mockMetadataService.getTokenBalanceAndMetadata.mockRejectedValue(
      new Error('token not found'),
    );
    const coordinator = createCoordinator();

    await expect(
      coordinator.ensureMetadata({
        caip19,
        accountCaip10,
      }),
    ).rejects.toThrow('token not found');
    expect(coordinator.getMetadata(caip19)).toBeUndefined();
  });

  it('notifies listeners when balance sync completes', async () => {
    const coordinator = createCoordinator();

    const onUpdate = jest.fn();
    const syncCompleted = new Promise<void>((resolve) => {
      coordinator.onUpdate(() => {
        onUpdate();
        if (coordinator.getBalance(caip19)) {
          resolve();
        }
      });
    });

    coordinator.sync({
      accountCaip10,
      tokenCaip19s: [caip19],
      balanceCaip19: caip19,
    });

    await syncCompleted;

    expect(onUpdate).toHaveBeenCalled();
    expect(coordinator.getBalance(caip19)?.formatted).toBeDefined();
    expect(coordinator.isBalancePending(caip19)).toBe(false);
  });

  it('marks balance failed and notifies listeners when the balance fetch fails', async () => {
    mockMetadataService.getTokenBalanceAndMetadata.mockRejectedValue(
      new Error('balance unavailable'),
    );
    const coordinator = createCoordinator();

    const updateCompleted = new Promise<void>((resolve) => {
      coordinator.onUpdate(() => {
        if (!coordinator.isBalancePending(caip19)) {
          resolve();
        }
      });
    });

    coordinator.sync({
      accountCaip10,
      tokenCaip19s: [caip19],
      balanceCaip19: caip19,
    });

    expect(coordinator.isBalancePending(caip19)).toBe(true);

    await updateCompleted;

    expect(coordinator.getBalance(caip19)).toBeUndefined();
    expect(coordinator.isBalancePending(caip19)).toBe(false);
  });

  it('notifies listeners when a background metadata fetch fails', async () => {
    mockMetadataService.getTokenBalanceAndMetadata.mockRejectedValue(
      new Error('metadata unavailable'),
    );
    const coordinator = createCoordinator();

    const updateCompleted = new Promise<void>((resolve) => {
      coordinator.onUpdate(() => {
        resolve();
      });
    });

    coordinator.sync({
      accountCaip10,
      tokenCaip19s: [caip19],
    });

    await updateCompleted;

    expect(coordinator.getMetadata(caip19)).toBeUndefined();
  });
});
