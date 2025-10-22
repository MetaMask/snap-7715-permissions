import { describe, expect, beforeEach, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

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
import {
  convertReadableDateToTimestamp,
  TIME_PERIOD_TO_SECONDS,
} from '../../../src/utils/time';
import { parseUnits } from '../../../src/utils/value';

const ACCOUNT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
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
  isAdjustmentAllowed: true,
};

const alreadyPopulatedPermission: Erc20TokenPeriodicPermission = {
  ...permissionWithoutOptionals,
  data: {
    ...permissionWithoutOptionals.data,
  },
};

const alreadyPopulatedPermissionRequest: Erc20TokenPeriodicPermissionRequest = {
  address: ACCOUNT_ADDRESS,
  chainId: '0x1',
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: convertReadableDateToTimestamp('05/01/2024'),
      },
      isAdjustmentAllowed: true,
    },
  ],
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
    isAdjustmentAllowed: true,
  },
};

const alreadyPopulatedContext: Erc20TokenPeriodicContext = {
  expiry: {
    timestamp: 1714521600,
    isAdjustmentAllowed: true,
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
    periodAmount: '100',
    periodDuration: Number(TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]).toString(),
    startTime: 1729900800,
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
        isAdjustmentAllowed: true,
      };

      const populatedPermission = await populatePermission({ permission });

      expect(populatedPermission).toStrictEqual(permission);
    });

    it('should set startTime to current timestamp when it is null', async () => {
      const beforeTime = Math.floor(Date.now() / 1000);

      const permission: Erc20TokenPeriodicPermission = {
        type: 'erc20-token-periodic',
        data: {
          tokenAddress,
          periodAmount: '0x1000000000000000000000000000000000000000',
          periodDuration: 86400,
          startTime: null,
          justification: 'Permission to do something important',
        },
        isAdjustmentAllowed: true,
      };

      const populatedPermission = await populatePermission({ permission });

      const afterTime = Math.floor(Date.now() / 1000);

      expect(populatedPermission.data.startTime).toBeGreaterThanOrEqual(
        beforeTime,
      );
      expect(populatedPermission.data.startTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('buildContext()', () => {
    let mockTokenMetadataService: jest.Mocked<TokenMetadataService>;
    beforeEach(() => {
      mockTokenMetadataService = {
        getTokenBalanceAndMetadata: jest.fn(() => ({
          balance: BigInt(
            alreadyPopulatedContext.permissionDetails.periodAmount,
          ),
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
        tokenMetadataService: mockTokenMetadataService,
      });

      expect(context).toStrictEqual({
        ...alreadyPopulatedContext,
        tokenMetadata: {
          ...alreadyPopulatedContext.tokenMetadata,
          iconDataBase64: `data:image/png;base64,${base64}`,
        },
      });

      expect(
        mockTokenMetadataService.getTokenBalanceAndMetadata,
      ).toHaveBeenCalledWith({
        chainId: Number(alreadyPopulatedPermissionRequest.chainId),
        account: ACCOUNT_ADDRESS,
        assetAddress: tokenAddress,
      });
    });

    it('throws an error if the expiry rule is not found', async () => {
      const permissionRequest = {
        ...alreadyPopulatedPermissionRequest,
        rules: [],
      };

      await expect(
        buildContext({
          permissionRequest,
          tokenMetadataService: mockTokenMetadataService,
        }),
      ).rejects.toThrow(
        'Expiry rule not found. An expiry is required on all permissions.',
      );
    });

    it('throws an error if the permission request has no rules', async () => {
      const permissionRequest = {
        ...alreadyPopulatedPermissionRequest,
        rules: [],
      };

      await expect(
        buildContext({
          permissionRequest,
          tokenMetadataService: mockTokenMetadataService,
        }),
      ).rejects.toThrow(
        'Expiry rule not found. An expiry is required on all permissions.',
      );
    });
  });

  describe('deriveMetadata()', () => {
    const dateInTheFuture = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours from now
    const startTime = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours from now

    const context = {
      ...alreadyPopulatedContext,
      expiry: {
        timestamp: dateInTheFuture,
        isAdjustmentAllowed: true,
      },
      permissionDetails: {
        ...alreadyPopulatedContext.permissionDetails,
        startTime, // 12 hours from now (before expiry)
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
            startTime: -1, // Special case for invalid format
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
            startTime: 1577836800, // 01/01/2020
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
          expiry: {
            timestamp: 499161600, // 10/26/1985
            isAdjustmentAllowed: true,
          },
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

      it('should return a validation error for invalid expiry -1', async () => {
        const contextWithInvalidExpiry = {
          ...context,
          expiry: {
            timestamp: -1,
            isAdjustmentAllowed: true,
          },
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
      });

      it.each([[12345678], [0x1234], [999999999]])(
        'should return a validation error for invalid expiry %s',
        async (expiry) => {
          const contextWithInvalidExpiry = {
            ...context,
            expiry: {
              timestamp: expiry,
              isAdjustmentAllowed: true,
            },
            permissionDetails: {
              ...context.permissionDetails,
            },
          };

          const metadata = await deriveMetadata({
            context: contextWithInvalidExpiry,
          });

          expect(metadata.validationErrors).toStrictEqual({
            expiryError: 'Expiry must be in the future',
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
          startTime: Math.floor(Date.now() / 1000),
        },
        expiry: {
          timestamp: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60), // 30 days from now
          isAdjustmentAllowed: true,
        },
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
