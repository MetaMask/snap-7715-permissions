import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { Erc20TokenSwapPermissionRequest } from '../../../src/permissions/erc20TokenSwap/types';
import { parseAndValidate } from '../../../src/permissions/erc20TokenSwap/validation';

const ACCOUNT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const OTHER_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const SPEND_TOKEN = '0x1111111111111111111111111111111111111111';
const RECEIVE_TOKEN = '0x2222222222222222222222222222222222222222';
const ROUTER = '0x3333333333333333333333333333333333333333';

const expiryTimestamp = Math.floor(Date.now() / 1000) + 86400 * 30;

const validPermissionRequest: Erc20TokenSwapPermissionRequest = {
  chainId: '0x1',
  from: ACCOUNT_ADDRESS,
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: expiryTimestamp,
      },
    },
  ],
  to: '0x1',
  permission: {
    type: 'erc20-token-swap',
    data: {
      justification: 'Exit the position if an exploit is detected',
      spend: {
        tokenAddress: SPEND_TOKEN,
        maxAmount: bigIntToHex(1_000n),
      },
      receive: {
        tokenAddress: RECEIVE_TOKEN,
        minAmount: bigIntToHex(900n),
      },
      via: {
        targets: [ROUTER],
        selectors: ['removeLiquiditySingleToken(address,address,uint256)'],
      },
    },
    isAdjustmentAllowed: true,
  },
};

/**
 * Builds a request with the given permission data overrides.
 * @param data - Partial permission data to merge into the valid request.
 * @returns The amended request, loosely typed for negative tests.
 */
const withData = (data: Record<string, unknown>): any => ({
  ...validPermissionRequest,
  permission: {
    ...validPermissionRequest.permission,
    data: {
      ...validPermissionRequest.permission.data,
      ...data,
    },
  },
});

describe('erc20TokenSwap:validation', () => {
  describe('parseAndValidate()', () => {
    it('should validate a valid permission request', () => {
      expect(() => parseAndValidate(validPermissionRequest)).not.toThrow();
      expect(parseAndValidate(validPermissionRequest)).toStrictEqual(
        validPermissionRequest,
      );
    });

    it('accepts 4-byte hex selectors', () => {
      const request = withData({
        via: { targets: [ROUTER], selectors: ['0xa9059cbb'] },
      });

      expect(() => parseAndValidate(request)).not.toThrow();
    });

    it('accepts a recipient equal to the granting account', () => {
      const request = withData({ recipient: ACCOUNT_ADDRESS.toLowerCase() });

      expect(parseAndValidate(request).permission.data.recipient).toBe(
        ACCOUNT_ADDRESS,
      );
    });

    it('allows a missing expiry rule like other permissions', () => {
      const missingExpiry = {
        ...validPermissionRequest,
        rules: [],
      };

      expect(() => parseAndValidate(missingExpiry as any)).not.toThrow();
    });

    it('should throw for invalid permission type', () => {
      const invalidTypeRequest = {
        ...validPermissionRequest,
        permission: {
          ...validPermissionRequest.permission,
          type: 'erc20-token-allowance',
        },
      };

      expect(() => parseAndValidate(invalidTypeRequest as any)).toThrow(
        'Failed type validation: type: Invalid literal value, expected "erc20-token-swap"',
      );
    });

    it('should throw for zero spend.maxAmount', () => {
      const request = withData({
        spend: { tokenAddress: SPEND_TOKEN, maxAmount: '0x0' },
      });

      expect(() => parseAndValidate(request)).toThrow(
        'Invalid spend.maxAmount: must be greater than 0',
      );
    });

    it('should throw for zero receive.minAmount', () => {
      const request = withData({
        receive: { tokenAddress: RECEIVE_TOKEN, minAmount: '0x0' },
      });

      expect(() => parseAndValidate(request)).toThrow(
        'Invalid receive.minAmount: must be greater than 0',
      );
    });

    it('should throw when spend and receive tokens are the same', () => {
      const request = withData({
        receive: { tokenAddress: SPEND_TOKEN, minAmount: bigIntToHex(900n) },
      });

      expect(() => parseAndValidate(request)).toThrow(
        'must differ from spend.tokenAddress',
      );
    });

    it('should throw for the zero address as a token', () => {
      const request = withData({
        spend: {
          tokenAddress: '0x0000000000000000000000000000000000000000',
          maxAmount: bigIntToHex(1_000n),
        },
      });

      expect(() => parseAndValidate(request)).toThrow(
        'Address cannot be the zero address',
      );
    });

    it('should throw when no targets are provided', () => {
      const request = withData({
        via: { targets: [], selectors: ['0xa9059cbb'] },
      });

      expect(() => parseAndValidate(request)).toThrow('via.targets');
    });

    it('should throw when too many targets are provided', () => {
      const request = withData({
        via: {
          targets: [
            '0x0000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000002',
            '0x0000000000000000000000000000000000000003',
            '0x0000000000000000000000000000000000000004',
            '0x0000000000000000000000000000000000000005',
            '0x0000000000000000000000000000000000000006',
          ],
          selectors: ['0xa9059cbb'],
        },
      });

      expect(() => parseAndValidate(request)).toThrow('via.targets');
    });

    it('should throw for duplicate targets regardless of casing', () => {
      const request = withData({
        via: {
          targets: [ROUTER, ROUTER.toUpperCase().replace('0X', '0x')],
          selectors: ['0xa9059cbb'],
        },
      });

      expect(() => parseAndValidate(request)).toThrow(
        'Invalid via.targets: must not contain duplicates',
      );
    });

    it('should throw when no selectors are provided', () => {
      const request = withData({
        via: { targets: [ROUTER], selectors: [] },
      });

      expect(() => parseAndValidate(request)).toThrow('via.selectors');
    });

    it('should throw when too many selectors are provided', () => {
      const request = withData({
        via: {
          targets: [ROUTER],
          selectors: Array.from({ length: 9 }, (_, index) => `fn${index}()`),
        },
      });

      expect(() => parseAndValidate(request)).toThrow('via.selectors');
    });

    it('should throw for a selector that is neither hex nor a signature', () => {
      const request = withData({
        via: { targets: [ROUTER], selectors: ['not a selector'] },
      });

      expect(() => parseAndValidate(request)).toThrow(
        'Invalid selector: must be a 4-byte hex selector or an ABI function signature',
      );
    });

    it('should throw for duplicate selectors', () => {
      const request = withData({
        via: { targets: [ROUTER], selectors: ['0xA9059CBB', '0xa9059cbb'] },
      });

      expect(() => parseAndValidate(request)).toThrow(
        'Invalid via.selectors: must not contain duplicates',
      );
    });

    it('should throw when the recipient is not the granting account', () => {
      const request = withData({ recipient: OTHER_ADDRESS });

      expect(() => parseAndValidate(request)).toThrow(
        'Invalid recipient: must be the account granting the permission',
      );
    });

    it('should throw when a recipient is given without a from address', () => {
      const request = {
        ...withData({ recipient: ACCOUNT_ADDRESS }),
        from: undefined,
      };

      expect(() => parseAndValidate(request)).toThrow(
        'Invalid recipient: must be the account granting the permission',
      );
    });

    it('should throw when redeemer rule has no addresses', () => {
      const invalidRedeemerRuleRequest = {
        ...validPermissionRequest,
        rules: [
          ...(validPermissionRequest.rules ?? []),
          {
            type: 'redeemer',
            data: {
              addresses: [],
            },
          },
        ],
      };

      expect(() => parseAndValidate(invalidRedeemerRuleRequest as any)).toThrow(
        'Invalid redeemer rule: must include a non-empty addresses array',
      );
    });
  });
});
