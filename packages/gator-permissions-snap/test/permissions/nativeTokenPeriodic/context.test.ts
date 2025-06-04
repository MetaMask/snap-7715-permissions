import { describe, expect, beforeEach, it } from '@jest/globals';
import { toHex, parseUnits } from 'viem/utils';

import type { AccountController } from '../../../src/accountController';
import { TimePeriod } from '../../../src/core/types';
import {
  populatePermission,
  buildContext,
  deriveMetadata,
  applyContext,
} from '../../../src/permissions/nativeTokenPeriodic/context';
import type {
  NativeTokenPeriodicContext,
  NativeTokenPeriodicPermission,
  NativeTokenPeriodicPermissionRequest,
} from '../../../src/permissions/nativeTokenPeriodic/types';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';
import type { TokenPricesService } from '../../../src/services/tokenPricesService';
import {
  convertTimestampToReadableDate,
  convertReadableDateToTimestamp,
  TIME_PERIOD_TO_SECONDS,
} from '../../../src/utils/time';

const permissionWithoutOptionals: NativeTokenPeriodicPermission = {
  type: 'native-token-periodic',
  data: {
    periodAmount: toHex(parseUnits('1', 18)), // 1 ETH per period
    periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]), // 1 day in seconds
    startTime: convertReadableDateToTimestamp('10/26/1985'),
    justification: 'Permission to do something important',
  },
};

const alreadyPopulatedPermission: NativeTokenPeriodicPermission = {
  ...permissionWithoutOptionals,
  data: {
    ...permissionWithoutOptionals.data,
  },
  rules: {},
};

const alreadyPopulatedPermissionRequest: NativeTokenPeriodicPermissionRequest =
  {
    chainId: '0x1',
    expiry: convertReadableDateToTimestamp('05/01/2024'),
    signer: {
      type: 'account',
      data: {
        address: '0x1',
      },
    },
    permission: alreadyPopulatedPermission,
  };

const alreadyPopulatedContext: NativeTokenPeriodicContext = {
  expiry: '05/01/2024',
  isAdjustmentAllowed: true,
  justification: 'Permission to do something important',
  accountDetails: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    balance: toHex(parseUnits('10', 18)),
    balanceFormattedAsCurrency: '$🐊10.00',
    symbol: 'ETH',
    decimals: 18,
  },
  permissionDetails: {
    periodAmount: '1',
    periodType: TimePeriod.DAILY,
    periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]).toString(),
    startTime: '10/26/1985',
  },
} as const;

describe('nativeTokenPeriodic:context', () => {
  describe('populatePermission()', () => {
    it('should return the permission unchanged if it is already populated', async () => {
      const populatedPermission = await populatePermission({
        permission: alreadyPopulatedPermission,
      });

      expect(populatedPermission).toStrictEqual(alreadyPopulatedPermission);
    });

    it('should not override existing rules', async () => {
      const permission: NativeTokenPeriodicPermission = {
        type: 'native-token-periodic',
        data: {
          periodAmount: '0x1000000000000000000000000000000000000000',
          periodDuration: 86400,
          startTime: 1714531200,
          justification: 'Permission to do something important',
        },
        rules: {
          some: 'rule',
        },
      };

      const populatedPermission = await populatePermission({ permission });

      expect(populatedPermission).toStrictEqual(permission);
    });
  });

  describe('permissionRequestToContext()', () => {
    let mockTokenPricesService: jest.Mocked<TokenPricesService>;
    let mockAccountController: jest.Mocked<AccountController>;
    let mockTokenMetadataService: jest.Mocked<TokenMetadataService>;

    beforeEach(() => {
      mockTokenPricesService = {
        getCryptoToFiatConversion: jest.fn(
          () =>
            alreadyPopulatedContext.accountDetails.balanceFormattedAsCurrency,
        ),
      } as unknown as jest.Mocked<TokenPricesService>;

      mockAccountController = {
        getAccountAddress: jest
          .fn()
          .mockResolvedValue(alreadyPopulatedContext.accountDetails.address),
      } as unknown as jest.Mocked<AccountController>;

      mockTokenMetadataService = {
        getTokenBalanceAndMetadata: jest.fn(() => ({
          balance: BigInt(alreadyPopulatedContext.accountDetails.balance),
          symbol: alreadyPopulatedContext.accountDetails.symbol,
          decimals: 18,
        })),
      } as unknown as jest.Mocked<TokenMetadataService>;
    });

    it('should create a context from a permission request', async () => {
      const context = await buildContext({
        permissionRequest: alreadyPopulatedPermissionRequest,
        tokenPricesService: mockTokenPricesService,
        accountController: mockAccountController,
        tokenMetadataService: mockTokenMetadataService,
      });

      expect(context).toStrictEqual(alreadyPopulatedContext);

      expect(mockAccountController.getAccountAddress).toHaveBeenCalledWith({
        chainId: Number(alreadyPopulatedPermissionRequest.chainId),
      });

      expect(
        mockTokenMetadataService.getTokenBalanceAndMetadata,
      ).toHaveBeenCalledWith({
        chainId: Number(alreadyPopulatedPermissionRequest.chainId),
        account: alreadyPopulatedContext.accountDetails.address,
      });

      expect(
        mockTokenPricesService.getCryptoToFiatConversion,
      ).toHaveBeenCalledWith(
        `eip155:1/slip44:60`,
        alreadyPopulatedContext.accountDetails.balance,
        18,
      );
    });
  });

  describe('createContextMetadata()', () => {
    const context = {
      ...alreadyPopulatedContext,
      expiry: convertTimestampToReadableDate(Date.now()),
      permissionDetails: {
        ...alreadyPopulatedContext.permissionDetails,
        startTime: convertTimestampToReadableDate(Date.now() / 1000),
      },
    };

    it('should create metadata for a context', async () => {
      const metadata = await deriveMetadata({
        context,
      });

      expect(metadata).toStrictEqual({
        validationErrors: {},
      });
    });

    describe('periodAmount validation', () => {
      it.each([['0x1234'], ['Steve']])(
        'should return a validation error for invalid period amount %s',
        async (periodAmount) => {
          const contextWithInvalidPeriodAmount = {
            ...context,
            permissionDetails: {
              ...context.permissionDetails,
              periodAmount,
            },
          };

          const metadata = await deriveMetadata({
            context: contextWithInvalidPeriodAmount,
          });

          expect(metadata.validationErrors).toStrictEqual({
            periodAmountError: 'Invalid period amount',
          });
        },
      );

      it('should return a validation error for negative period amount', async () => {
        const contextWithNegativePeriodAmount = {
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            periodAmount: '-1',
          },
        };

        const metadata = await deriveMetadata({
          context: contextWithNegativePeriodAmount,
        });

        expect(metadata.validationErrors).toStrictEqual({
          periodAmountError: 'Period amount must be greater than 0',
        });
      });
    });

    describe('periodDuration validation', () => {
      it('should return a validation error for invalid period duration', async () => {
        const contextWithInvalidPeriodDuration = {
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            periodDuration: 'invalid',
          },
        };

        const metadata = await deriveMetadata({
          context: contextWithInvalidPeriodDuration,
        });

        expect(metadata.validationErrors).toStrictEqual({
          periodDurationError: 'Period duration must be greater than 0',
        });
      });

      it('should return a validation error for negative period duration', async () => {
        const contextWithNegativePeriodDuration = {
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            periodDuration: '-1',
          },
        };

        const metadata = await deriveMetadata({
          context: contextWithNegativePeriodDuration,
        });

        expect(metadata.validationErrors).toStrictEqual({
          periodDurationError: 'Period duration must be greater than 0',
        });
      });
    });

    describe('startTime validation', () => {
      it('should return a validation error for invalid start time', async () => {
        const contextWithInvalidStartTime = {
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            startTime: 'invalid',
          },
        };

        const metadata = await deriveMetadata({
          context: contextWithInvalidStartTime,
        });

        expect(metadata.validationErrors).toStrictEqual({
          startTimeError: 'Invalid start time',
        });
      });

      it('should return a validation error for start time in the past', async () => {
        const contextWithPastStartTime = {
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            startTime: '01/01/2020',
          },
        };

        const metadata = await deriveMetadata({
          context: contextWithPastStartTime,
        });

        expect(metadata.validationErrors).toStrictEqual({
          startTimeError: 'Start time must be today or later',
        });
      });
    });

    describe('expiry validation', () => {
      it('should return a validation error for expiry in the past', async () => {
        const contextWithExpiryInThePast = {
          ...context,
          expiry: '10/26/1985',
          permissionDetails: {
            ...context.permissionDetails,
          },
        };

        const metadata = await deriveMetadata({
          context: contextWithExpiryInThePast,
        });

        expect(metadata.validationErrors).toStrictEqual({
          expiryError: 'Expiry must be in the future',
        });
      });

      it.each([['12345678'], ['0x1234'], ['Steve']])(
        'should return a validation error for invalid expiry %s',
        async (expiry) => {
          const contextWithInvalidExpiry = {
            ...context,
            expiry,
            permissionDetails: {
              ...context.permissionDetails,
            },
          };

          const metadata = await deriveMetadata({
            context: contextWithInvalidExpiry,
          });

          expect(metadata.validationErrors).toStrictEqual({
            expiryError: 'Invalid expiry',
          });
        },
      );
    });

    describe('contextToPermissionRequest()', () => {
      it('should convert a context to a permission request', async () => {
        const permissionRequest = await applyContext({
          context: alreadyPopulatedContext,
          originalRequest: alreadyPopulatedPermissionRequest,
        });

        expect(permissionRequest).toStrictEqual(
          alreadyPopulatedPermissionRequest,
        );
      });
    });
  });
});
