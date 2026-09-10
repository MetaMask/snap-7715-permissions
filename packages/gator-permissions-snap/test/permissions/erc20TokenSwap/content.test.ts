import { describe, expect, it } from '@jest/globals';

import { renderBody } from '../../../src/permissions/erc20TokenSwap/content';
import type {
  Erc20TokenSwapContext,
  Erc20TokenSwapMetadata,
} from '../../../src/permissions/erc20TokenSwap/types';

const ACCOUNT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const SPEND_TOKEN = '0x4444444444444444444444444444444444444444';
const RECEIVE_TOKEN = '0x5555555555555555555555555555555555555555';
const ROUTER = '0x3333333333333333333333333333333333333333';

const mockContext: Erc20TokenSwapContext = {
  expiry: {
    timestamp: 1714521600, // 05/01/2024
  },
  isAdjustmentAllowed: true,
  justification: 'Exit the position if an exploit is detected',
  accountAddressCaip10: `eip155:1:${ACCOUNT_ADDRESS}`,
  tokenAddressCaip19: `eip155:1/erc20:${SPEND_TOKEN}`,
  tokenMetadata: {
    symbol: 'LP',
    decimals: 18,
    iconDataBase64: null,
  },
  receiveTokenAddressCaip19: `eip155:1/erc20:${RECEIVE_TOKEN}`,
  receiveTokenMetadata: {
    symbol: 'USDC',
    decimals: 6,
    iconDataBase64: null,
  },
  permissionDetails: {
    maxSpendAmount: '40000',
    minReceiveAmount: '36427.61',
    targets: [ROUTER],
    selectors: [
      'removeLiquiditySingleToken(address,address,uint256)',
      '0xdeadbeef',
    ],
  },
};

const mockMetadata: Erc20TokenSwapMetadata = {
  validationErrors: {},
};

describe('erc20TokenSwap:content', () => {
  describe('renderBody()', () => {
    it('renders the outcome, the allow-lists, and the expiry field', async () => {
      const content = await renderBody({
        context: mockContext,
        metadata: mockMetadata,
      });

      const rendered = JSON.stringify(content);

      expect(rendered).toContain('Swap up to');
      expect(rendered).toContain('40000');
      expect(rendered).toContain('Receive at least');
      expect(rendered).toContain('36427.61');
      expect(rendered).toContain('USDC');
      expect(rendered).toContain('Delivered to');
      expect(rendered).toContain('Allowed contracts');
      expect(rendered).toContain(ROUTER);
      expect(rendered).toContain('Allowed functions');
      expect(rendered).toContain('removeLiquiditySingleToken()');
      expect(rendered).toContain('0xdeadbeef');
      expect(rendered).toContain('erc20-token-swap-expiry');
    });

    it('renders editable amount inputs when adjustment is allowed', async () => {
      const content = await renderBody({
        context: mockContext,
        metadata: mockMetadata,
      });

      const rendered = JSON.stringify(content);

      expect(rendered).toContain('erc20-token-swap-max-spend-amount');
      expect(rendered).toContain('erc20-token-swap-min-receive-amount');
    });

    it('renders read-only amounts when adjustment is not allowed', async () => {
      const content = await renderBody({
        context: { ...mockContext, isAdjustmentAllowed: false },
        metadata: mockMetadata,
      });

      const rendered = JSON.stringify(content);

      expect(rendered).not.toContain('erc20-token-swap-max-spend-amount');
      expect(rendered).not.toContain('erc20-token-swap-min-receive-amount');
      expect(rendered).toContain('40000');
      expect(rendered).toContain('36427.61');
      // Expiry stays adjustable, and the allow-lists are always shown.
      expect(rendered).toContain('erc20-token-swap-expiry');
      expect(rendered).toContain(ROUTER);
    });

    it('surfaces validation errors on the amount fields', async () => {
      const content = await renderBody({
        context: mockContext,
        metadata: {
          validationErrors: {
            maxSpendAmountError: 'Max spend amount must be greater than 0',
          },
        },
      });

      expect(JSON.stringify(content)).toContain(
        'Max spend amount must be greater than 0',
      );
    });
  });
});
