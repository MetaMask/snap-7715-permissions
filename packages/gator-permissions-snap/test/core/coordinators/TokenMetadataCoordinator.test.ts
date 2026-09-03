import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type { CaipAssetType } from '@metamask/snaps-sdk';

import { TokenMetadataCoordinator } from '../../../src/core/coordinators/TokenMetadataCoordinator';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';
import type { TokenPricesService } from '../../../src/services/tokenPricesService';

describe('TokenMetadataCoordinator', () => {
  const caip19 = 'eip155:1/slip44:60' as CaipAssetType;
  const secondCaip19 =
    'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType;
  const accountCaip10 = 'eip155:1:0x1234567890123456789012345678901234567890';
  const secondAccountCaip10 =
    'eip155:1:0x2222222222222222222222222222222222222222';

  let mockMetadataService: jest.Mocked<
    Pick<
      TokenMetadataService,
      | 'getTokenMetadata'
      | 'getTokenBalanceAndMetadata'
      | 'fetchIconDataAsBase64'
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
    jest.spyOn(logger, 'debug').mockImplementation(() => undefined);

    mockMetadataService = {
      getTokenMetadata: jest
        .fn<TokenMetadataService['getTokenMetadata']>()
        .mockResolvedValue({
          decimals: 18,
          symbol: 'ETH',
          iconUrl: undefined,
        }),
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
    });

    expect(metadata.symbol).toBe('ETH');
    expect(coordinator.getMetadata(caip19)?.decimals).toBe(18);
  });

  it('stores base64 icon data when icon URL resolves', async () => {
    const iconUrl = 'https://example.com/eth.png';
    const iconDataBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    mockMetadataService.getTokenMetadata.mockResolvedValueOnce({
      decimals: 18,
      symbol: 'ETH',
      iconUrl,
    });
    mockMetadataService.fetchIconDataAsBase64.mockResolvedValueOnce({
      ok: true,
      imageDataBase64: iconDataBase64,
    });

    const coordinator = createCoordinator();
    const metadata = await coordinator.ensureMetadata({
      caip19,
    });

    expect(mockMetadataService.fetchIconDataAsBase64).toHaveBeenCalledWith(
      iconUrl,
    );
    expect(metadata.iconDataBase64).toBe(iconDataBase64);
    expect(coordinator.getMetadata(caip19)?.iconDataBase64).toBe(
      iconDataBase64,
    );
  });

  it('rejects ensureMetadata when metadata fetch fails', async () => {
    mockMetadataService.getTokenMetadata.mockRejectedValue(
      new Error('token not found'),
    );
    const coordinator = createCoordinator();

    await expect(
      coordinator.ensureMetadata({
        caip19,
      }),
    ).rejects.toThrow('token not found');
    expect(coordinator.getMetadata(caip19)).toBeUndefined();
  });

  it('notifies listeners when a background metadata fetch completes', async () => {
    const coordinator = createCoordinator();
    const onUpdate = jest.fn();
    coordinator.onUpdate(onUpdate);

    coordinator.start({
      tokenCaip19s: [caip19],
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(coordinator.getMetadata(caip19)?.symbol).toBe('ETH');
  });

  it('notifies listeners when a background metadata fetch fails', async () => {
    mockMetadataService.getTokenMetadata.mockRejectedValue(
      new Error('metadata unavailable'),
    );
    const coordinator = createCoordinator();
    const onUpdate = jest.fn();
    coordinator.onUpdate(onUpdate);

    coordinator.start({
      tokenCaip19s: [caip19],
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(coordinator.getMetadata(caip19)).toBeUndefined();
  });

  it('allows start before onUpdate and still calls onUpdate for later completions', async () => {
    let resolveMetadata:
      | ((value: {
          decimals: number;
          symbol: string;
          iconUrl: undefined;
        }) => void)
      | undefined;
    mockMetadataService.getTokenMetadata.mockImplementation(
      async () =>
        new Promise((resolve) => {
          resolveMetadata = resolve;
        }),
    );

    const coordinator = createCoordinator();
    coordinator.start({
      tokenCaip19s: [caip19],
    });

    const onUpdate = jest.fn();
    coordinator.onUpdate(onUpdate);

    expect(onUpdate).not.toHaveBeenCalled();

    resolveMetadata?.({
      decimals: 18,
      symbol: 'ETH',
      iconUrl: undefined,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('does not notify onUpdate for metadata already resolved by ensureMetadata', async () => {
    const coordinator = createCoordinator();
    await coordinator.ensureMetadata({
      caip19,
    });

    const onUpdate = jest.fn();
    coordinator.onUpdate(onUpdate);
    coordinator.start({
      tokenCaip19s: [caip19],
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onUpdate).not.toHaveBeenCalled();
    expect(mockMetadataService.getTokenMetadata).toHaveBeenCalledTimes(1);
  });

  it('joins an in-flight start fetch from ensureMetadata', async () => {
    let resolveMetadata:
      | ((value: {
          decimals: number;
          symbol: string;
          iconUrl: undefined;
        }) => void)
      | undefined;
    mockMetadataService.getTokenMetadata.mockImplementation(
      async () =>
        new Promise((resolve) => {
          resolveMetadata = resolve;
        }),
    );

    const coordinator = createCoordinator();
    coordinator.start({
      tokenCaip19s: [caip19],
    });

    const ensurePromise = coordinator.ensureMetadata({
      caip19,
    });

    expect(mockMetadataService.getTokenMetadata).toHaveBeenCalledTimes(1);

    resolveMetadata?.({
      decimals: 18,
      symbol: 'ETH',
      iconUrl: undefined,
    });

    await expect(ensurePromise).resolves.toMatchObject({ symbol: 'ETH' });
  });

  it('throws if start is called more than once', () => {
    const coordinator = createCoordinator();
    coordinator.start({
      tokenCaip19s: [caip19],
    });

    expect(() =>
      coordinator.start({
        tokenCaip19s: [caip19],
      }),
    ).toThrow('TokenMetadataCoordinator.start() called more than once');
  });

  it('throws if onUpdate is called more than once', () => {
    const coordinator = createCoordinator();
    coordinator.onUpdate(jest.fn());

    expect(() => coordinator.onUpdate(jest.fn())).toThrow(
      'TokenMetadataCoordinator onUpdate callback already registered',
    );
  });

  it('fetches and caches balance per account and token', async () => {
    const coordinator = createCoordinator();

    const first = await coordinator.getBalance({
      accountCaip10,
      caip19,
    });
    const second = await coordinator.getBalance({
      accountCaip10,
      caip19,
    });

    expect(first.formatted).toBeDefined();
    expect(first.fiat).toBe('$1');
    expect(second).toBe(first);
    expect(
      mockMetadataService.getTokenBalanceAndMetadata,
    ).toHaveBeenCalledTimes(1);
    expect(mockPricesService.getCryptoToFiatConversion).toHaveBeenCalledTimes(
      1,
    );
  });

  it('fetches a new balance when the account changes', async () => {
    mockMetadataService.getTokenBalanceAndMetadata
      .mockResolvedValueOnce({
        balance: 1000n,
        decimals: 18,
        symbol: 'ETH',
        iconUrl: undefined,
      })
      .mockResolvedValueOnce({
        balance: 2000n,
        decimals: 18,
        symbol: 'ETH',
        iconUrl: undefined,
      });

    const coordinator = createCoordinator();

    const first = await coordinator.getBalance({
      accountCaip10,
      caip19,
    });
    const second = await coordinator.getBalance({
      accountCaip10: secondAccountCaip10,
      caip19,
    });

    expect(first.formatted).not.toBe(second.formatted);
    expect(
      mockMetadataService.getTokenBalanceAndMetadata,
    ).toHaveBeenCalledTimes(2);
  });

  it('fetches a new balance when the token changes', async () => {
    const coordinator = createCoordinator();

    await coordinator.getBalance({
      accountCaip10,
      caip19,
    });
    await coordinator.getBalance({
      accountCaip10,
      caip19: secondCaip19,
    });

    expect(
      mockMetadataService.getTokenBalanceAndMetadata,
    ).toHaveBeenCalledTimes(2);
  });

  it('retries getBalance after a failed fetch', async () => {
    mockMetadataService.getTokenBalanceAndMetadata
      .mockRejectedValueOnce(new Error('balance unavailable'))
      .mockResolvedValueOnce({
        balance: 1000n,
        decimals: 18,
        symbol: 'ETH',
        iconUrl: undefined,
      });

    const coordinator = createCoordinator();

    await expect(
      coordinator.getBalance({
        accountCaip10,
        caip19,
      }),
    ).rejects.toThrow('balance unavailable');

    const balance = await coordinator.getBalance({
      accountCaip10,
      caip19,
    });

    expect(balance.fiat).toBe('$1');
    expect(
      mockMetadataService.getTokenBalanceAndMetadata,
    ).toHaveBeenCalledTimes(2);
  });

  it('uses cached metadata decimals for fiat conversion when available', async () => {
    mockMetadataService.getTokenMetadata.mockResolvedValueOnce({
      decimals: 6,
      symbol: 'USDC',
      iconUrl: undefined,
    });
    mockMetadataService.getTokenBalanceAndMetadata.mockResolvedValueOnce({
      balance: 1000n,
      decimals: 18,
      symbol: 'USDC',
      iconUrl: undefined,
    });

    const coordinator = createCoordinator();
    await coordinator.ensureMetadata({
      caip19: secondCaip19,
    });

    await coordinator.getBalance({
      accountCaip10,
      caip19: secondCaip19,
    });

    expect(mockPricesService.getCryptoToFiatConversion).toHaveBeenCalledWith(
      secondCaip19,
      expect.any(String),
      6,
    );
  });
});
