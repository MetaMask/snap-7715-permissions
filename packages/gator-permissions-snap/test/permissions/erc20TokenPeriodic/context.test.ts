import { describe, expect, beforeEach, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { AccountController } from '../../../src/accountController';
import { TimePeriod } from '../../../src/core/types';
import {
  populatePermission,
  buildContext,
  deriveMetadata,
  applyContext,
} from '../../../src/permissions/erc20TokenPeriodic/context';
import type {
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicPermission,
  Erc20TokenPeriodicPermissionRequest,
} from '../../../src/permissions/erc20TokenPeriodic/types';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';
import type { TokenPricesService } from '../../../src/services/tokenPricesService';
import {
  convertTimestampToReadableDate,
  convertReadableDateToTimestamp,
  TIME_PERIOD_TO_SECONDS,
} from '../../../src/utils/time';
import { parseUnits } from '../../../src/utils/value';

const tokenDecimals = 6;
const tokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC

const permissionWithoutOptionals: Erc20TokenPeriodicPermission = {
  type: 'erc20-token-periodic',
  data: {
    periodAmount: bigIntToHex(
      parseUnits({ formatted: '100', decimals: tokenDecimals }),
    ), // 100 USDC per period
    periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]), // 1 day in seconds
    startTime: convertReadableDateToTimestamp('10/26/2024'),
    tokenAddress,
    justification: 'Permission to do something important',
  },
};

const alreadyPopulatedPermission: Erc20TokenPeriodicPermission = {
  ...permissionWithoutOptionals,
  data: {
    ...permissionWithoutOptionals.data,
  },
  rules: {},
};

const alreadyPopulatedPermissionRequest: Erc20TokenPeriodicPermissionRequest = {
  chainId: '0x1',
  expiry: convertReadableDateToTimestamp('05/01/2024'),
  signer: {
    type: 'account',
    data: {
      address: '0x1',
    },
  },
  permission: {
    ...alreadyPopulatedPermission,
    data: {
      ...alreadyPopulatedPermission.data,
      startTime: convertReadableDateToTimestamp('10/26/2024'),
    },
  },
};

const alreadyPopulatedContext: Erc20TokenPeriodicContext = {
  expiry: '1714514400',
  isAdjustmentAllowed: true,
  justification: 'Permission to do something important',
  accountDetails: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    balance: bigIntToHex(
      parseUnits({ formatted: '1000', decimals: tokenDecimals }),
    ),
    balanceFormattedAsCurrency: '$🐊1,000.00',
  },
  tokenMetadata: {
    symbol: 'USDC',
    decimals: tokenDecimals,
    iconDataBase64: null,
  },
  permissionDetails: {
    periodAmount: '100',
    periodType: TimePeriod.DAILY,
    periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]).toString(),
    startTime: '1729893600',
  },
} as const;

describe('erc20TokenPeriodic:context', () => {
  describe('populatePermission()', () => {
    it('should return the permission unchanged if it is already populated', async () => {
      const populatedPermission = await populatePermission({
        permission: alreadyPopulatedPermission,
      });

      expect(populatedPermission).toStrictEqual(alreadyPopulatedPermission);
    });

    it('should not override existing rules', async () => {
      const permission: Erc20TokenPeriodicPermission = {
        type: 'erc20-token-periodic',
        data: {
          periodAmount: bigIntToHex(
            parseUnits({ formatted: '50', decimals: tokenDecimals }),
          ),
          periodDuration: 86400,
          startTime: 1714531200,
          tokenAddress,
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
          symbol: alreadyPopulatedContext.tokenMetadata.symbol,
          decimals: tokenDecimals,
          iconUrl: 'https://example.com/icon.png',
        })),
        fetchIconDataAsBase64: jest.fn(async () =>
          Promise.resolve({ success: false }),
        ),
      } as unknown as jest.Mocked<TokenMetadataService>;
    });

    it('should create a context from a permission request', async () => {
      const text = 'The contents of the image';
      /* eslint-disable no-restricted-globals */
      const base64 = Buffer.from(text, 'utf8').toString('base64');

      mockTokenMetadataService.fetchIconDataAsBase64.mockResolvedValueOnce({
        success: true,
        imageDataBase64: `data:image/png;base64,${base64}`,
      });

      const context = await buildContext({
        permissionRequest: alreadyPopulatedPermissionRequest,
        tokenPricesService: mockTokenPricesService,
        accountController: mockAccountController,
        tokenMetadataService: mockTokenMetadataService,
      });

      expect(context).toStrictEqual({
        ...alreadyPopulatedContext,
        tokenMetadata: {
          ...alreadyPopulatedContext.tokenMetadata,
          iconDataBase64: `data:image/png;base64,${base64}`,
        },
      });

      expect(mockAccountController.getAccountAddress).toHaveBeenCalledWith({
        chainId: Number(alreadyPopulatedPermissionRequest.chainId),
      });

      expect(
        mockTokenMetadataService.getTokenBalanceAndMetadata,
      ).toHaveBeenCalledWith({
        chainId: Number(alreadyPopulatedPermissionRequest.chainId),
        account: alreadyPopulatedContext.accountDetails.address,
        assetAddress: tokenAddress,
      });

      expect(
        mockTokenPricesService.getCryptoToFiatConversion,
      ).toHaveBeenCalledWith(
        `eip155:1/erc20:${tokenAddress}`,
        alreadyPopulatedContext.accountDetails.balance,
        tokenDecimals,
      );
    });
  });

  describe('createContextMetadata()', () => {
    const dateInTheFuture = (
      Math.floor(Date.now() / 1000) +
      24 * 60 * 60
    ).toString(); // 24 hours from now

    const context = {
      ...alreadyPopulatedContext,
      expiry: dateInTheFuture,
      permissionDetails: {
        ...alreadyPopulatedContext.permissionDetails,
        startTime: dateInTheFuture,
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
            startTime: dateInTheFuture,
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
  });

  describe('applyContext()', () => {
    it('should apply context changes to original request', async () => {
      const context = {
        ...alreadyPopulatedContext,
        permissionDetails: {
          ...alreadyPopulatedContext.permissionDetails,
          periodAmount: '200',
          periodDuration: '604800', // 1 week
          startTime: convertTimestampToReadableDate(Date.now() / 1000),
        },
        expiry: convertTimestampToReadableDate(
          Date.now() / 1000 + 30 * 24 * 60 * 60,
        ), // 30 days from now
      };

      const result = await applyContext({
        context,
        originalRequest: alreadyPopulatedPermissionRequest,
      });

      expect(result.permission.type).toBe('erc20-token-periodic');
      expect(result.permission.data.periodAmount).toBe(
        bigIntToHex(parseUnits({ formatted: '200', decimals: tokenDecimals })),
      );
      expect(result.permission.data.periodDuration).toBe(604800);
      expect(result.permission.data.tokenAddress).toBe(tokenAddress);
      expect(result.permission.data.justification).toBe(
        alreadyPopulatedPermissionRequest.permission.data.justification,
      );
    });
  });
});
