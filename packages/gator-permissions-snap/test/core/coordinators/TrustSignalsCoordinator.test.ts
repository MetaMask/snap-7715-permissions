import { logger } from '@metamask/7715-permissions-shared/utils';
import type { Hex } from '@metamask/utils';

import type {
  FetchAddressScanResult,
  ScanDappUrlResult,
  TrustSignalsClient,
} from '../../../src/clients/trustSignalsClient';
import {
  AddressScanResultType,
  RecommendedAction,
} from '../../../src/clients/trustSignalsClient';
import { TrustSignalsCoordinator } from '../../../src/core/coordinators/TrustSignalsCoordinator';

const mockScanAddressResult: FetchAddressScanResult = {
  resultType: AddressScanResultType.Benign,
  label: '',
};

const mockDappScanResult: ScanDappUrlResult = {
  isComplete: true,
  recommendedAction: RecommendedAction.WARN,
};

describe('TrustSignalsCoordinator', () => {
  let mockTrustSignalsClient: jest.Mocked<TrustSignalsClient>;
  let coordinator: TrustSignalsCoordinator;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(logger, 'debug').mockImplementation(() => undefined);

    mockTrustSignalsClient = {
      scanDappUrl: jest.fn(),
      fetchAddressScan: jest.fn(),
    } as unknown as jest.Mocked<TrustSignalsClient>;

    mockTrustSignalsClient.scanDappUrl.mockResolvedValue({ isComplete: false });
    mockTrustSignalsClient.fetchAddressScan.mockResolvedValue(
      mockScanAddressResult,
    );

    coordinator = new TrustSignalsCoordinator({
      trustSignalsClient: mockTrustSignalsClient,
    });
  });

  it('returns null results before start is called', () => {
    expect(coordinator.getResults()).toStrictEqual({
      scanDappUrlResult: null,
      scanAddressResult: null,
    });
  });

  it('starts dapp URL scan and calls onUpdate when it resolves', async () => {
    mockTrustSignalsClient.scanDappUrl.mockResolvedValue(mockDappScanResult);

    const onUpdate = jest.fn();
    coordinator.onUpdate(onUpdate);
    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: undefined,
    });

    expect(mockTrustSignalsClient.scanDappUrl).toHaveBeenCalledWith(
      'https://example.com',
    );
    expect(mockTrustSignalsClient.fetchAddressScan).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(coordinator.getResults()).toStrictEqual({
      scanDappUrlResult: mockDappScanResult,
      scanAddressResult: null,
    });
  });

  it('calls onUpdate once per scan as each result settles', async () => {
    let resolveDappScan!: (result: ScanDappUrlResult) => void;
    let resolveAddressScan!: (result: FetchAddressScanResult) => void;

    mockTrustSignalsClient.scanDappUrl.mockImplementation(
      async () =>
        new Promise<ScanDappUrlResult>((resolve) => {
          resolveDappScan = resolve;
        }),
    );
    mockTrustSignalsClient.fetchAddressScan.mockImplementation(
      async () =>
        new Promise<FetchAddressScanResult>((resolve) => {
          resolveAddressScan = resolve;
        }),
    );

    const onUpdate = jest.fn();
    coordinator.onUpdate(onUpdate);
    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: '0xabc123',
    });

    expect(mockTrustSignalsClient.fetchAddressScan).toHaveBeenCalledWith(
      '0x1',
      '0xabc123',
    );
    expect(onUpdate).not.toHaveBeenCalled();

    resolveDappScan(mockDappScanResult);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(coordinator.getResults()).toStrictEqual({
      scanDappUrlResult: mockDappScanResult,
      scanAddressResult: null,
    });

    resolveAddressScan(mockScanAddressResult);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(coordinator.getResults()).toStrictEqual({
      scanDappUrlResult: mockDappScanResult,
      scanAddressResult: mockScanAddressResult,
    });
  });

  it('allows start before onUpdate and still calls onUpdate for later completions', async () => {
    let resolveScan!: (result: ScanDappUrlResult) => void;
    mockTrustSignalsClient.scanDappUrl.mockImplementation(
      async () =>
        new Promise<ScanDappUrlResult>((resolve) => {
          resolveScan = resolve;
        }),
    );

    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: undefined,
    });

    const onUpdate = jest.fn();
    coordinator.onUpdate(onUpdate);

    resolveScan(mockDappScanResult);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('does not call onUpdate on registration when results already settled', async () => {
    mockTrustSignalsClient.scanDappUrl.mockResolvedValue(mockDappScanResult);
    mockTrustSignalsClient.fetchAddressScan.mockResolvedValue(
      mockScanAddressResult,
    );

    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: '0xabc123',
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(coordinator.getResults()).toStrictEqual({
      scanDappUrlResult: mockDappScanResult,
      scanAddressResult: mockScanAddressResult,
    });

    const onUpdate = jest.fn();
    coordinator.onUpdate(onUpdate);

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('does not call onUpdate on registration when scans are still pending', () => {
    mockTrustSignalsClient.scanDappUrl.mockImplementation(
      async () => new Promise(() => undefined),
    );

    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: undefined,
    });

    const onUpdate = jest.fn();
    coordinator.onUpdate(onUpdate);

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('throws if start is called more than once', () => {
    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: undefined,
    });

    expect(() =>
      coordinator.start({
        origin: 'https://other.example.com',
        chainId: '0x1' as Hex,
        delegateAddress: undefined,
      }),
    ).toThrow('TrustSignalsCoordinator.start() called more than once');
  });

  it('throws if onUpdate is called more than once', () => {
    coordinator.onUpdate(jest.fn());

    expect(() => coordinator.onUpdate(jest.fn())).toThrow(
      'TrustSignalsCoordinator onUpdate callback already registered',
    );
  });

  it('logs and swallows dapp URL scan failures without calling onUpdate', async () => {
    mockTrustSignalsClient.scanDappUrl.mockRejectedValue(
      new Error('scan failed'),
    );

    const onUpdate = jest.fn();
    coordinator.onUpdate(onUpdate);
    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: undefined,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onUpdate).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(
      'TrustSignalsCoordinator: dapp URL scan failed',
      expect.objectContaining({ origin: 'https://example.com' }),
    );
  });

  it('logs and swallows address scan failures without calling onUpdate', async () => {
    mockTrustSignalsClient.fetchAddressScan.mockRejectedValue(
      new Error('address scan failed'),
    );

    const onUpdate = jest.fn();
    coordinator.onUpdate(onUpdate);
    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: '0xabc123',
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(
      'TrustSignalsCoordinator: address scan failed',
      expect.objectContaining({ address: '0xabc123' }),
    );
  });
});
