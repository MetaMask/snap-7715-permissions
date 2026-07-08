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

  it('starts dapp URL scan and notifies when it resolves', async () => {
    mockTrustSignalsClient.scanDappUrl.mockResolvedValue(mockDappScanResult);

    const onResults = jest.fn();
    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: undefined,
      onResults,
    });

    expect(mockTrustSignalsClient.scanDappUrl).toHaveBeenCalledWith(
      'https://example.com',
    );
    expect(mockTrustSignalsClient.fetchAddressScan).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onResults).toHaveBeenCalledWith({
      scanDappUrlResult: mockDappScanResult,
      scanAddressResult: null,
    });
    expect(coordinator.getResults()).toStrictEqual({
      scanDappUrlResult: mockDappScanResult,
      scanAddressResult: null,
    });
  });

  it('starts address scan when delegate address is provided', async () => {
    const delegateAddress = '0xabc123';
    const onResults = jest.fn();

    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress,
      onResults,
    });

    expect(mockTrustSignalsClient.fetchAddressScan).toHaveBeenCalledWith(
      '0x1',
      delegateAddress,
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onResults).toHaveBeenCalledTimes(2);
    expect(coordinator.getResults()).toStrictEqual({
      scanDappUrlResult: { isComplete: false },
      scanAddressResult: mockScanAddressResult,
    });
  });

  it('throws if start is called more than once', () => {
    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: undefined,
      onResults: jest.fn(),
    });

    expect(() =>
      coordinator.start({
        origin: 'https://other.example.com',
        chainId: '0x1' as Hex,
        delegateAddress: undefined,
        onResults: jest.fn(),
      }),
    ).toThrow('TrustSignalsCoordinator.start() called more than once');
  });

  it('logs and swallows dapp URL scan failures without calling onResults', async () => {
    mockTrustSignalsClient.scanDappUrl.mockRejectedValue(
      new Error('scan failed'),
    );

    const onResults = jest.fn();
    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: undefined,
      onResults,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onResults).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(
      'TrustSignalsCoordinator: dapp URL scan or UI update failed',
      expect.objectContaining({ origin: 'https://example.com' }),
    );
  });

  it('logs and swallows address scan failures without calling onResults', async () => {
    mockTrustSignalsClient.fetchAddressScan.mockRejectedValue(
      new Error('address scan failed'),
    );

    const onResults = jest.fn();
    coordinator.start({
      origin: 'https://example.com',
      chainId: '0x1' as Hex,
      delegateAddress: '0xabc123',
      onResults,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onResults).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(
      'TrustSignalsCoordinator: address scan or UI update failed',
      expect.objectContaining({ address: '0xabc123' }),
    );
  });
});
