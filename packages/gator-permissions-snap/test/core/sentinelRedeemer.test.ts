import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import type { Hex } from '@metamask/utils';

import {
  normalizePermissionRequestWithSentinelRedeemerRule,
  SENTINEL_REDEEMER_ADDRESSES,
} from '../../src/core/sentinelRedeemer';

const MOCK_PERMISSION_REQUEST = {
  chainId: '0x1',
  address: '0x0000000000000000000000000000000000000001',
  signer: {
    type: 'account',
    data: {
      address: '0x0000000000000000000000000000000000000002',
    },
  },
  permission: {
    type: 'native-token-stream',
    data: {
      initialAmount: '0x0',
      maxAmount: '0x1',
      amountPerSecond: '0x1',
      startTime: '0x1',
    },
  },
} as unknown as PermissionRequest;

describe('normalizePermissionRequestWithSentinelRedeemerRule', () => {
  it.each(['https://uniswap.org', 'https://app.uniswap.org'])(
    'adds the Sentinel redeemer rule for %s when rules are undefined',
    (origin) => {
      const result = normalizePermissionRequestWithSentinelRedeemerRule({
        origin,
        permissionRequest: MOCK_PERMISSION_REQUEST,
        chainId: 1,
      });

      expect(result.rules).toStrictEqual([
        {
          type: 'redeemer',
          data: { addresses: [...SENTINEL_REDEEMER_ADDRESSES] },
        },
      ]);
    },
  );

  it('does not add a Sentinel redeemer rule for unsupported chains', () => {
    const result = normalizePermissionRequestWithSentinelRedeemerRule({
      origin: 'https://app.uniswap.org',
      permissionRequest: MOCK_PERMISSION_REQUEST,
      chainId: 0x18c6,
    });

    expect(result).toBe(MOCK_PERMISSION_REQUEST);
  });

  it.each(['https://evil-uniswap.org', 'https://uniswap.org.evil.com'])(
    'does not add a Sentinel redeemer rule for origin-confusable host %s',
    (origin) => {
      const result = normalizePermissionRequestWithSentinelRedeemerRule({
        origin,
        permissionRequest: MOCK_PERMISSION_REQUEST,
        chainId: 1,
      });

      expect(result).toBe(MOCK_PERMISSION_REQUEST);
    },
  );

  it('does not add a Sentinel redeemer rule for malformed origins', () => {
    const result = normalizePermissionRequestWithSentinelRedeemerRule({
      origin: 'not an origin',
      permissionRequest: MOCK_PERMISSION_REQUEST,
      chainId: 1,
    });

    expect(result).toBe(MOCK_PERMISSION_REQUEST);
  });

  it('preserves a non-Uniswap request with a non-Sentinel redeemer rule', () => {
    const permissionRequest = {
      ...MOCK_PERMISSION_REQUEST,
      rules: [
        {
          type: 'redeemer',
          data: {
            addresses: ['0x1111111111111111111111111111111111111111' as Hex],
          },
        },
      ],
    };

    const result = normalizePermissionRequestWithSentinelRedeemerRule({
      origin: 'https://example.com',
      permissionRequest,
      chainId: 1,
    });

    expect(result).toBe(permissionRequest);
  });

  it('rejects a Uniswap redeemer rule with an empty addresses array', () => {
    const permissionRequest = {
      ...MOCK_PERMISSION_REQUEST,
      rules: [{ type: 'redeemer', data: { addresses: [] } }],
    };

    expect(() =>
      normalizePermissionRequestWithSentinelRedeemerRule({
        origin: 'https://app.uniswap.org',
        permissionRequest,
        chainId: 1,
      }),
    ).toThrow(
      'Invalid redeemer rule: must include a non-empty addresses array',
    );
  });
});
