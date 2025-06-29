import { describe, expect, it } from '@jest/globals';
import { toHex, parseUnits } from 'viem/utils';

import { TimePeriod } from '../../../src/core/types';
import { createConfirmationContent } from '../../../src/permissions/erc20TokenPeriodic/content';
import type {
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
} from '../../../src/permissions/erc20TokenPeriodic/types';
import { TIME_PERIOD_TO_SECONDS } from '../../../src/utils/time';

const tokenDecimals = 6;

const mockContext: Erc20TokenPeriodicContext = {
  expiry: '05/01/2024',
  isAdjustmentAllowed: true,
  justification: 'Permission to do periodic ERC20 token transfers',
  accountDetails: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    balance: toHex(parseUnits('1000', tokenDecimals)),
    balanceFormattedAsCurrency: '$🐊1000.00',
  },
  tokenMetadata: {
    symbol: 'USDC',
    decimals: tokenDecimals,
    iconDataBase64:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
  permissionDetails: {
    periodAmount: '100',
    periodType: TimePeriod.DAILY,
    periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]).toString(),
    startTime: '10/26/1985',
  },
};

const mockMetadata: Erc20TokenPeriodicMetadata = {
  validationErrors: {},
};

describe('erc20TokenPeriodic:content', () => {
  describe('createConfirmationContent()', () => {
    it('should render content with ERC20 token details', async () => {
      const content = await createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
        isJustificationCollapsed: true,
        origin: 'https://example.com',
        chainId: 1,
      });

      expect(content).toBeDefined();
      expect(content.type).toBe('Box');
      expect(content.props.children).toBeDefined();
    });

    it('should render content with validation errors', async () => {
      const contextWithErrors = {
        ...mockContext,
        permissionDetails: {
          ...mockContext.permissionDetails,
          periodAmount: 'invalid',
        },
      };

      const metadataWithErrors: Erc20TokenPeriodicMetadata = {
        validationErrors: {
          periodAmountError: 'Invalid period amount',
        },
      };

      const content = await createConfirmationContent({
        context: contextWithErrors,
        metadata: metadataWithErrors,
        isJustificationCollapsed: true,
        origin: 'https://example.com',
        chainId: 1,
      });

      expect(content).toBeDefined();
      expect(content.type).toBe('Box');
    });

    it('should render content with weekly period', async () => {
      const weeklyContext = {
        ...mockContext,
        permissionDetails: {
          ...mockContext.permissionDetails,
          periodType: TimePeriod.WEEKLY,
          periodDuration: Number(
            TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY],
          ).toString(),
        },
      };

      const content = await createConfirmationContent({
        context: weeklyContext,
        metadata: mockMetadata,
        isJustificationCollapsed: false,
        origin: 'https://dapp.example.com',
        chainId: 11155111, // Sepolia
      });

      expect(content).toBeDefined();
      expect(content.type).toBe('Box');
    });

    it('should render content with custom period duration', async () => {
      const customContext = {
        ...mockContext,
        permissionDetails: {
          ...mockContext.permissionDetails,
          periodType: 'Other' as const,
          periodDuration: '123456',
        },
      };

      const content = await createConfirmationContent({
        context: customContext,
        metadata: mockMetadata,
        isJustificationCollapsed: true,
        origin: 'https://custom.example.com',
        chainId: 137, // Polygon
      });

      expect(content).toBeDefined();
      expect(content.type).toBe('Box');
    });

    it('should render content without token icon', async () => {
      const contextWithoutIcon = {
        ...mockContext,
        tokenMetadata: {
          ...mockContext.tokenMetadata,
          iconDataBase64: null,
        },
      };

      const content = await createConfirmationContent({
        context: contextWithoutIcon,
        metadata: mockMetadata,
        isJustificationCollapsed: true,
        origin: 'https://noicon.example.com',
        chainId: 1,
      });

      expect(content).toBeDefined();
      expect(content.type).toBe('Box');
    });

    it('should handle different chain IDs correctly', async () => {
      const content = await createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
        isJustificationCollapsed: true,
        origin: 'https://polygon.example.com',
        chainId: 137, // Polygon
      });

      expect(content).toBeDefined();
      expect(content.type).toBe('Box');
    });

    it('should render content with multiple validation errors', async () => {
      const metadataWithMultipleErrors: Erc20TokenPeriodicMetadata = {
        validationErrors: {
          periodAmountError: 'Invalid period amount',
          periodDurationError: 'Invalid period duration',
          startTimeError: 'Invalid start time',
          expiryError: 'Invalid expiry',
        },
      };

      const content = await createConfirmationContent({
        context: mockContext,
        metadata: metadataWithMultipleErrors,
        isJustificationCollapsed: false,
        origin: 'https://errors.example.com',
        chainId: 1,
      });

      expect(content).toBeDefined();
      expect(content.type).toBe('Box');
    });

    it('should render with expanded justification', async () => {
      const content = await createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
        isJustificationCollapsed: false,
        origin: 'https://expanded.example.com',
        chainId: 1,
      });

      expect(content).toBeDefined();
      expect(content.type).toBe('Box');
    });
  });
});
