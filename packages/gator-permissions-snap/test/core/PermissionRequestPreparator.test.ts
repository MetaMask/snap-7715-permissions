import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { bytesToHex } from '@metamask/utils';
import type { Hex } from '@metamask/utils';

import type { AccountController } from '../../src/core/accountController';
import { PermissionRequestPreparator } from '../../src/core/PermissionRequestPreparator';
import { SENTINEL_REDEEMER_ADDRESSES } from '../../src/core/sentinelRedeemer';
import type { SnapsMetricsService } from '../../src/services/snapsMetricsService';

const randomAddress = (): Hex => {
  const randomBytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256);
  }
  return bytesToHex(randomBytes);
};

const mockAddress = '0x1234567890123456789012345678901234567890' as const;
const mockAddress2 = '0x1234567890123456789012345678901234567891' as const;
const grantingAccountAddress = randomAddress();
const requestingAccountAddress = randomAddress();
const expiryTimestamp = Math.floor(Date.now() / 1000 + 3600);

const mockPermissionRequest: PermissionRequest = {
  chainId: '0x1',
  to: requestingAccountAddress,
  permission: {
    type: 'test-permission',
    data: {},
    isAdjustmentAllowed: true,
  },
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: expiryTimestamp,
      },
    },
  ],
};

const mockAccountController = {
  getAccountAddresses: jest.fn(),
} as unknown as jest.Mocked<AccountController>;

const mockSnapsMetricsService = {
  trackPermissionRequestStarted: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<SnapsMetricsService>;

describe('PermissionRequestPreparator', () => {
  let permissionRequestPreparator: PermissionRequestPreparator;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccountController.getAccountAddresses.mockResolvedValue([
      grantingAccountAddress,
    ]);

    permissionRequestPreparator = new PermissionRequestPreparator({
      accountController: mockAccountController,
      snapsMetricsService: mockSnapsMetricsService,
    });
  });

  it('validates chain, tracks metrics, and normalizes the request', async () => {
    const parseAndValidate = jest.fn().mockImplementation((req) => req);

    const result = await permissionRequestPreparator.prepare({
      origin: 'test-origin',
      permissionRequest: mockPermissionRequest,
      parseAndValidate,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected preparation to succeed');
    }

    expect(parseAndValidate).toHaveBeenCalledWith(mockPermissionRequest);
    expect(
      mockSnapsMetricsService.trackPermissionRequestStarted,
    ).toHaveBeenCalledWith({
      origin: 'test-origin',
      permissionType: 'test-permission',
      chainId: mockPermissionRequest.chainId,
      permissionData: mockPermissionRequest.permission.data,
    });
    expect(result.chainId).toBe(1);
    expect(result.permissionType).toBe('test-permission');
    expect(result.normalizedRequest.from).toBe(grantingAccountAddress);
  });

  it('resolves the first available address when from is not provided', async () => {
    mockAccountController.getAccountAddresses.mockResolvedValue([
      mockAddress,
      mockAddress2,
    ]);

    const result = await permissionRequestPreparator.prepare({
      origin: 'test-origin',
      permissionRequest: mockPermissionRequest,
      parseAndValidate: (req) => req,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected preparation to succeed');
    }

    expect(result.normalizedRequest.from).toBe(mockAddress);
    expect(mockAccountController.getAccountAddresses).toHaveBeenCalledTimes(1);
  });

  it.each([mockAddress, mockAddress2])(
    'accepts a provided from address when it belongs to the account',
    async (specifiedAddress) => {
      mockAccountController.getAccountAddresses.mockResolvedValue([
        mockAddress,
        mockAddress2,
      ]);

      const result = await permissionRequestPreparator.prepare({
        origin: 'test-origin',
        permissionRequest: {
          ...mockPermissionRequest,
          from: specifiedAddress,
        },
        parseAndValidate: (req) => req,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error('Expected preparation to succeed');
      }

      expect(result.normalizedRequest.from).toBe(specifiedAddress);
    },
  );

  it('rejects a from address that is not available for the account', async () => {
    mockAccountController.getAccountAddresses.mockResolvedValue([
      mockAddress,
      mockAddress2,
    ]);

    const result = await permissionRequestPreparator.prepare({
      origin: 'test-origin',
      permissionRequest: {
        ...mockPermissionRequest,
        from: '0x9876543210987654321098765432109876543210',
      },
      parseAndValidate: (req) => req,
    });

    expect(result).toStrictEqual({
      ok: false,
      reason: 'Requested address not found',
    });
  });

  it('adds the sentinel redeemer rule for uniswap.org requests with no redeemer rule', async () => {
    const requestWithoutRedeemerRule = {
      ...mockPermissionRequest,
      rules: [mockPermissionRequest.rules[0]],
    };

    const result = await permissionRequestPreparator.prepare({
      origin: 'https://app.uniswap.org',
      permissionRequest: requestWithoutRedeemerRule,
      parseAndValidate: (req) => req,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected preparation to succeed');
    }

    expect(result.normalizedRequest.rules).toStrictEqual([
      requestWithoutRedeemerRule.rules[0],
      {
        type: 'redeemer',
        data: { addresses: SENTINEL_REDEEMER_ADDRESSES },
      },
    ]);
  });

  it('preserves a uniswap.org redeemer rule that only contains sentinel addresses', async () => {
    const requestedRedeemerRule = {
      type: 'redeemer',
      data: { addresses: [SENTINEL_REDEEMER_ADDRESSES[0]] },
    };
    const requestWithSentinelRedeemerRule = {
      ...mockPermissionRequest,
      rules: [mockPermissionRequest.rules[0], requestedRedeemerRule],
    };

    const result = await permissionRequestPreparator.prepare({
      origin: 'https://uniswap.org',
      permissionRequest: requestWithSentinelRedeemerRule,
      parseAndValidate: (req) => req,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected preparation to succeed');
    }

    expect(result.normalizedRequest.rules).toStrictEqual(
      requestWithSentinelRedeemerRule.rules,
    );
  });

  it('rejects uniswap.org redeemer rules with non-sentinel addresses', async () => {
    const requestWithUnsupportedRedeemerRule = {
      ...mockPermissionRequest,
      rules: [
        mockPermissionRequest.rules[0],
        {
          type: 'redeemer',
          data: {
            addresses: [
              SENTINEL_REDEEMER_ADDRESSES[0],
              '0x1111111111111111111111111111111111111111',
            ],
          },
        },
      ],
    };

    const result = await permissionRequestPreparator.prepare({
      origin: 'https://app.uniswap.org',
      permissionRequest: requestWithUnsupportedRedeemerRule,
      parseAndValidate: (req) => req,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected preparation to fail');
    }

    expect(result.reason).toBe(
      'Redeemer rule includes addresses other than allowed values: 0x1111111111111111111111111111111111111111. Permissions granted on this domain may only be redeemed via MetaMask Sentinel.',
    );
  });
});
