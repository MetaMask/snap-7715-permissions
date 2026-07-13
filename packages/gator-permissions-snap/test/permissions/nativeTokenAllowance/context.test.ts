import { beforeEach, describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import {
  applyContext,
  buildContext,
} from '../../../src/permissions/nativeTokenAllowance/context';
import type {
  NativeTokenAllowanceContext,
  NativeTokenAllowancePermissionRequest,
} from '../../../src/permissions/nativeTokenAllowance/types';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';
import { parseUnits } from '../../../src/utils/value';

const ACCOUNT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

const startTime = 1729900800;
const expiryTimestamp = startTime + 86400 * 30;

const permissionRequest: NativeTokenAllowancePermissionRequest = {
  from: ACCOUNT_ADDRESS,
  chainId: '0x1',
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: expiryTimestamp,
      },
    },
    {
      type: 'redeemer',
      data: {
        addresses: ['0x1111111111111111111111111111111111111111'],
      },
    },
    {
      type: 'payee',
      data: {
        addresses: ['0x2222222222222222222222222222222222222222'],
      },
    },
  ],
  to: '0x1',
  permission: {
    type: 'native-token-allowance',
    data: {
      allowanceAmount: bigIntToHex(
        parseUnits({ formatted: '1', decimals: 18 }),
      ),
      startTime,
      justification: 'Permission to do something important',
    },
    isAdjustmentAllowed: true,
  },
};

const baseContext: NativeTokenAllowanceContext = {
  expiry: {
    timestamp: expiryTimestamp,
  },
  redeemerAddresses: ['0x1111111111111111111111111111111111111111'],
  payeeAddresses: ['0x2222222222222222222222222222222222222222'],
  isAdjustmentAllowed: true,
  justification: 'Permission to do something important',
  accountAddressCaip10: `eip155:1:${ACCOUNT_ADDRESS}`,
  tokenAddressCaip19: 'eip155:1/slip44:60',
  tokenMetadata: {
    symbol: 'ETH',
    decimals: 18,
    iconDataBase64: null,
  },
  permissionDetails: {
    allowanceAmount: '1',
    startTime,
  },
};

describe('nativeTokenAllowance:context', () => {
  let mockTokenMetadataService: jest.Mocked<TokenMetadataService>;

  beforeEach(() => {
    mockTokenMetadataService = {
      getTokenBalanceAndMetadata: jest.fn(() => ({
        balance: BigInt(0),
        symbol: baseContext.tokenMetadata.symbol,
        decimals: baseContext.tokenMetadata.decimals,
        iconUrl: 'https://example.com/icon.png',
      })),
      fetchIconDataAsBase64: jest.fn(async () =>
        Promise.resolve({ ok: false, reason: 'Icon URL not provided' }),
      ),
    } as unknown as jest.Mocked<TokenMetadataService>;
  });

  describe('buildContext()', () => {
    it('includes redeemer and payee addresses from rules', async () => {
      const context = await buildContext(permissionRequest, {
        tokenMetadataService: mockTokenMetadataService,
      });

      expect(context.redeemerAddresses).toStrictEqual([
        '0x1111111111111111111111111111111111111111',
      ]);
      expect(context.payeeAddresses).toStrictEqual([
        '0x2222222222222222222222222222222222222222',
      ]);
    });
  });

  describe('applyContext()', () => {
    it('preserves redeemer and payee rules from the original request', async () => {
      const result = await applyContext({
        context: baseContext,
        originalRequest: permissionRequest,
      });

      expect(result.rules).toStrictEqual(permissionRequest.rules);
    });
  });
});
