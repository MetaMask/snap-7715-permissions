import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import {
  applyContext,
  deriveMetadata,
} from '../../../src/permissions/erc20TokenAllowance/context';
import type {
  Erc20TokenAllowanceContext,
  Erc20TokenAllowancePermissionRequest,
} from '../../../src/permissions/erc20TokenAllowance/types';
import { parseUnits } from '../../../src/utils/value';

const ACCOUNT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const tokenDecimals = 6;
const tokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

const startTime = 1729900800;
const expiryTimestamp = startTime + 86400 * 30;

const permissionRequest: Erc20TokenAllowancePermissionRequest = {
  from: ACCOUNT_ADDRESS,
  chainId: '0x1',
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
    type: 'erc20-token-allowance',
    data: {
      allowanceAmount: bigIntToHex(
        parseUnits({ formatted: '100', decimals: tokenDecimals }),
      ),
      startTime,
      tokenAddress,
      justification: 'Permission to do something important',
    },
    isAdjustmentAllowed: true,
  },
};

const baseContext: Erc20TokenAllowanceContext = {
  expiry: {
    timestamp: expiryTimestamp,
  },
  isAdjustmentAllowed: true,
  justification: 'Permission to do something important',
  accountAddressCaip10: `eip155:1:${ACCOUNT_ADDRESS}`,
  tokenAddressCaip19: `eip155:1/erc20:${tokenAddress}`,
  tokenMetadata: {
    symbol: 'USDC',
    decimals: tokenDecimals,
    iconDataBase64: null,
  },
  permissionDetails: {
    allowanceAmount: '100',
    startTime,
  },
};

describe('erc20TokenAllowance:context', () => {
  describe('applyContext()', () => {
    it('writes allowance data without a derived period duration', async () => {
      const result = await applyContext({
        context: baseContext,
        originalRequest: permissionRequest,
      });

      expect(result.permission.type).toBe('erc20-token-allowance');
      expect(result.permission.data).not.toHaveProperty('periodDuration');
      expect(result.permission.data.tokenAddress).toBe(tokenAddress);
      expect(result.permission.data.allowanceAmount).toBe(
        permissionRequest.permission.data.allowanceAmount,
      );
    });
  });

  describe('deriveMetadata()', () => {
    it('does not require expiry when absent', async () => {
      const contextNoExpiry: Erc20TokenAllowanceContext = {
        ...baseContext,
        expiry: undefined,
      };

      const metadata = await deriveMetadata({ context: contextNoExpiry });

      expect(metadata.validationErrors.expiryError).toBeUndefined();
    });
  });
});
