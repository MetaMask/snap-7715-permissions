import { describe, expect, it } from '@jest/globals';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
} from '../../../src/permissions/nativeTokenStream/types';
import { TimePeriod } from '../../../src/core/types';
import { toHex, parseUnits } from 'viem/utils';
import { createConfirmationContent } from '../../../src/permissions/nativeTokenStream/content';

const mockContext: NativeTokenStreamContext = {
  expiry: '05/01/2024',
  isAdjustmentAllowed: true,
  accountDetails: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    balance: toHex(parseUnits('10', 18)),
    balanceFormattedAsCurrency: '$🐊10.00',
  },
  permissionDetails: {
    initialAmount: '1',
    maxAmount: '10',
    timePeriod: TimePeriod.WEEKLY,
    startTime: '10/26/1985',
    amountPerPeriod: '302400',
  },
};

const mockMetadata: NativeTokenStreamMetadata = {
  amountPerSecond: '0.5',
  validationErrors: {},
};

describe('nativeTokenStream:content', () => {
  describe('createConfirmationContent()', () => {
    it('should render content with all permission details', () => {
      const content = createConfirmationContent({
        context: mockContext,
        metadata: mockMetadata,
      });

      expect(content).toMatchSnapshot();
    });

    it('should render content with validation errors', () => {
      const contentWithErrors = createConfirmationContent({
        context: mockContext,
        metadata: {
          ...mockMetadata,
          validationErrors: {
            amountPerPeriodError: 'Invalid amount',
            initialAmountError: 'Invalid initial amount',
          },
        },
      });

      expect(contentWithErrors).toMatchSnapshot();
    });

    it('should handle disabled fields when adjustment is not allowed', () => {
      const contentWithoutAdjustment = createConfirmationContent({
        context: {
          ...mockContext,
          isAdjustmentAllowed: false,
        },
        metadata: mockMetadata,
      });

      expect(contentWithoutAdjustment).toMatchSnapshot();
    });

    it('should handle missing optional fields', () => {
      const contentWithMissingFields = createConfirmationContent({
        context: {
          ...mockContext,
          permissionDetails: {
            ...mockContext.permissionDetails,
            initialAmount: undefined,
            maxAmount: undefined,
          },
        },
        metadata: mockMetadata,
      });

      expect(contentWithMissingFields).toMatchSnapshot();
    });

    it('should handle different time periods', () => {
      const contentWithDailyPeriod = createConfirmationContent({
        context: {
          ...mockContext,
          permissionDetails: {
            ...mockContext.permissionDetails,
            timePeriod: TimePeriod.DAILY,
          },
        },
        metadata: mockMetadata,
      });

      expect(contentWithDailyPeriod).toMatchSnapshot();
    });
  });
});
