import { beforeEach, describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import {
  applyContext,
  buildContext,
  deriveMetadata,
  populatePermission,
} from '../../../src/permissions/erc20TokenSwap/context';
import type {
  Erc20TokenSwapContext,
  Erc20TokenSwapPermission,
  Erc20TokenSwapPermissionRequest,
} from '../../../src/permissions/erc20TokenSwap/types';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';
import { parseUnits } from '../../../src/utils/value';

const ACCOUNT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const OTHER_ACCOUNT_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const REDEEMER_ADDRESS = '0x1111111111111111111111111111111111111111';
const SPEND_TOKEN = '0x4444444444444444444444444444444444444444';
const RECEIVE_TOKEN = '0x5555555555555555555555555555555555555555';
const ROUTER = '0x3333333333333333333333333333333333333333';

const spendDecimals = 18;
const receiveDecimals = 6;

const expiryTimestamp = Math.floor(Date.now() / 1000) + 86400 * 30;

const permission: Erc20TokenSwapPermission = {
  type: 'erc20-token-swap',
  data: {
    justification: 'Exit the position if an exploit is detected',
    spend: {
      tokenAddress: SPEND_TOKEN,
      maxAmount: bigIntToHex(
        parseUnits({ formatted: '40000', decimals: spendDecimals }),
      ),
    },
    receive: {
      tokenAddress: RECEIVE_TOKEN,
      minAmount: bigIntToHex(
        parseUnits({ formatted: '36427.61', decimals: receiveDecimals }),
      ),
    },
    via: {
      targets: [ROUTER],
      selectors: ['removeLiquiditySingleToken(address,address,uint256)'],
    },
  },
  isAdjustmentAllowed: true,
};

const permissionRequest: Erc20TokenSwapPermissionRequest = {
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
        addresses: [REDEEMER_ADDRESS],
      },
    },
  ],
  to: '0x1',
  permission,
};

const baseContext: Erc20TokenSwapContext = {
  expiry: {
    timestamp: expiryTimestamp,
  },
  redeemerAddresses: [REDEEMER_ADDRESS],
  isAdjustmentAllowed: true,
  justification: permission.data.justification,
  accountAddressCaip10: `eip155:1:${ACCOUNT_ADDRESS}`,
  tokenAddressCaip19: `eip155:1/erc20:${SPEND_TOKEN}`,
  tokenMetadata: {
    symbol: 'LP',
    decimals: spendDecimals,
    iconDataBase64: null,
  },
  receiveTokenAddressCaip19: `eip155:1/erc20:${RECEIVE_TOKEN}`,
  receiveTokenMetadata: {
    symbol: 'USDC',
    decimals: receiveDecimals,
    iconDataBase64: null,
  },
  permissionDetails: {
    maxSpendAmount: '40000',
    minReceiveAmount: '36427.61',
    targets: [ROUTER],
    selectors: ['removeLiquiditySingleToken(address,address,uint256)'],
  },
};

describe('erc20TokenSwap:context', () => {
  let mockTokenMetadataService: jest.Mocked<TokenMetadataService>;

  beforeEach(() => {
    mockTokenMetadataService = {
      getTokenBalanceAndMetadata: jest.fn(
        async ({ assetAddress }: { assetAddress?: string }) =>
          assetAddress === SPEND_TOKEN
            ? {
                balance: BigInt(0),
                symbol: 'LP',
                decimals: spendDecimals,
                iconUrl: 'https://example.com/lp.png',
              }
            : {
                balance: BigInt(0),
                symbol: 'USDC',
                decimals: receiveDecimals,
                iconUrl: 'https://example.com/usdc.png',
              },
      ),
      fetchIconDataAsBase64: jest.fn(async (iconUrl?: string) =>
        iconUrl === 'https://example.com/usdc.png'
          ? { ok: true, imageDataBase64: 'data:image/png;base64,usdc' }
          : { ok: false, reason: 'Icon URL not provided' },
      ),
    } as unknown as jest.Mocked<TokenMetadataService>;
  });

  describe('buildContext()', () => {
    it('builds a context with both tokens and formatted amounts', async () => {
      const context = await buildContext(permissionRequest, {
        tokenMetadataService: mockTokenMetadataService,
      });

      expect(context).toStrictEqual({
        ...baseContext,
        receiveTokenMetadata: {
          ...baseContext.receiveTokenMetadata,
          iconDataBase64: 'data:image/png;base64,usdc',
        },
      });
    });

    it('fetches metadata for the spend and receive tokens', async () => {
      await buildContext(permissionRequest, {
        tokenMetadataService: mockTokenMetadataService,
      });

      expect(
        mockTokenMetadataService.getTokenBalanceAndMetadata,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockTokenMetadataService.getTokenBalanceAndMetadata,
      ).toHaveBeenCalledWith({
        chainId: 1,
        account: ACCOUNT_ADDRESS,
        assetAddress: SPEND_TOKEN,
      });
      expect(
        mockTokenMetadataService.getTokenBalanceAndMetadata,
      ).toHaveBeenCalledWith({
        chainId: 1,
        account: ACCOUNT_ADDRESS,
        assetAddress: RECEIVE_TOKEN,
      });
    });

    it('omits expiry and redeemers when the rules are absent', async () => {
      const context = await buildContext(
        { ...permissionRequest, rules: [] },
        { tokenMetadataService: mockTokenMetadataService },
      );

      expect(context.expiry).toBeUndefined();
      expect(context).not.toHaveProperty('redeemerAddresses');
    });

    it('throws when the from address is missing', async () => {
      await expect(
        buildContext(
          { ...permissionRequest, from: undefined },
          { tokenMetadataService: mockTokenMetadataService },
        ),
      ).rejects.toThrow('PermissionRequest.address was not found');
    });
  });

  describe('applyContext()', () => {
    it('writes hex amounts using each token decimals', async () => {
      const result = await applyContext({
        context: {
          ...baseContext,
          permissionDetails: {
            ...baseContext.permissionDetails,
            maxSpendAmount: '30000',
            minReceiveAmount: '30000.5',
          },
        },
        originalRequest: permissionRequest,
      });

      expect(result.permission.type).toBe('erc20-token-swap');
      expect(result.permission.data.spend).toStrictEqual({
        tokenAddress: SPEND_TOKEN,
        maxAmount: bigIntToHex(
          parseUnits({ formatted: '30000', decimals: spendDecimals }),
        ),
      });
      expect(result.permission.data.receive).toStrictEqual({
        tokenAddress: RECEIVE_TOKEN,
        minAmount: bigIntToHex(
          parseUnits({ formatted: '30000.5', decimals: receiveDecimals }),
        ),
      });
    });

    it('derives from and recipient from the selected account', async () => {
      const result = await applyContext({
        context: {
          ...baseContext,
          accountAddressCaip10: `eip155:1:${OTHER_ACCOUNT_ADDRESS}`,
        },
        originalRequest: permissionRequest,
      });

      expect(result.from).toBe(OTHER_ACCOUNT_ADDRESS);
      expect(result.permission.data.recipient).toBe(OTHER_ACCOUNT_ADDRESS);
    });

    it('copies the allow-lists from the original request, not the context', async () => {
      const result = await applyContext({
        context: {
          ...baseContext,
          permissionDetails: {
            ...baseContext.permissionDetails,
            targets: [OTHER_ACCOUNT_ADDRESS],
            selectors: ['0xdeadbeef'],
          },
        },
        originalRequest: permissionRequest,
      });

      expect(result.permission.data.via).toStrictEqual(permission.data.via);
    });

    it('merges the expiry and redeemer rules', async () => {
      const newExpiry = expiryTimestamp + 86400;
      const result = await applyContext({
        context: { ...baseContext, expiry: { timestamp: newExpiry } },
        originalRequest: permissionRequest,
      });

      expect(result.rules).toStrictEqual([
        { type: 'expiry', data: { timestamp: newExpiry } },
        { type: 'redeemer', data: { addresses: [REDEEMER_ADDRESS] } },
      ]);
    });
  });

  describe('populatePermission()', () => {
    it('returns the permission when the recipient is set', async () => {
      const withRecipient: Erc20TokenSwapPermission = {
        ...permission,
        data: { ...permission.data, recipient: ACCOUNT_ADDRESS },
      };

      const populated = await populatePermission({
        permission: withRecipient,
      });

      expect(populated).toStrictEqual(withRecipient);
    });

    it('throws when the recipient has not been resolved', async () => {
      await expect(populatePermission({ permission })).rejects.toThrow(
        'Invalid recipient: must be resolved to the granting account',
      );
    });
  });

  describe('deriveMetadata()', () => {
    it('returns no errors for a valid context', async () => {
      const metadata = await deriveMetadata({ context: baseContext });

      expect(metadata).toStrictEqual({ validationErrors: {} });
    });

    it('reports invalid amounts for each field', async () => {
      const metadata = await deriveMetadata({
        context: {
          ...baseContext,
          permissionDetails: {
            ...baseContext.permissionDetails,
            maxSpendAmount: '0',
            minReceiveAmount: 'abc',
          },
        },
      });

      expect(metadata.validationErrors.maxSpendAmountError).toBe(
        'Max spend amount must be greater than 0',
      );
      expect(metadata.validationErrors.minReceiveAmountError).toBeDefined();
    });

    it('reports an expiry in the past', async () => {
      const metadata = await deriveMetadata({
        context: { ...baseContext, expiry: { timestamp: 1 } },
      });

      expect(metadata.validationErrors.expiryError).toBeDefined();
    });

    it('does not require expiry when absent', async () => {
      const metadata = await deriveMetadata({
        context: { ...baseContext, expiry: undefined },
      });

      expect(metadata.validationErrors.expiryError).toBeUndefined();
    });
  });
});
