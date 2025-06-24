import { describe, expect, beforeEach, it } from '@jest/globals';
import { maxUint256 } from 'viem';
import { toHex, parseUnits } from 'viem/utils';

import type { AccountController } from '../../../src/accountController';
import { TimePeriod } from '../../../src/core/types';
import {
  populatePermission,
  buildContext,
  deriveMetadata,
  applyContext,
} from '../../../src/permissions/nativeTokenStream/context';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamPermission,
  NativeTokenStreamPermissionRequest,
} from '../../../src/permissions/nativeTokenStream/types';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';
import type { TokenPricesService } from '../../../src/services/tokenPricesService';
import {
  convertTimestampToReadableDate,
  convertReadableDateToTimestamp,
} from '../../../src/utils/time';

const permissionWithoutOptionals: NativeTokenStreamPermission = {
  type: 'native-token-stream',
  data: {
    amountPerSecond: toHex(parseUnits('.5', 18)), // 0.5 eth per second
    startTime: convertReadableDateToTimestamp('10/26/1985'),
    justification: 'Permission to do something important',
  },
};

const alreadyPopulatedPermission: NativeTokenStreamPermission = {
  ...permissionWithoutOptionals,
  data: {
    ...permissionWithoutOptionals.data,
    // 1 Eth
    initialAmount: toHex(parseUnits('1', 18)),
    // 10 Eth
    maxAmount: toHex(parseUnits('10', 18)),
  },
  rules: {},
};

const alreadyPopulatedPermissionRequest: NativeTokenStreamPermissionRequest = {
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

const alreadyPopulatedContext: NativeTokenStreamContext = {
  expiry: '05/01/2024',
  isAdjustmentAllowed: true,
  justification: 'Permission to do something important',
  accountDetails: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    balance: toHex(parseUnits('10', 18)),
    balanceFormattedAsCurrency: '$🐊10.00',
  },
  tokenMetadata: {
    symbol: 'ETH',
    decimals: 18,
    iconDataBase64: null,
  },
  permissionDetails: {
    initialAmount: '1',
    maxAmount: '10',
    timePeriod: TimePeriod.WEEKLY,
    startTime: '10/26/1985',
    amountPerPeriod: '302400',
  },
} as const;

describe('nativeTokenStream:context', () => {
  describe('populatePermission()', () => {
    it('should return the permission unchanged if it is already populated', async () => {
      const populatedPermission = await populatePermission({
        permission: alreadyPopulatedPermission,
      });

      expect(populatedPermission).toStrictEqual(alreadyPopulatedPermission);
    });

    it('should add defaults to a permission', async () => {
      const populatedPermission = await populatePermission({
        permission: permissionWithoutOptionals,
      });

      expect(populatedPermission).toStrictEqual({
        ...permissionWithoutOptionals,
        data: {
          ...permissionWithoutOptionals.data,
          initialAmount: '0x0',
          maxAmount: toHex(maxUint256),
        },
        rules: {},
      });
    });

    it('should not override existing rules', async () => {
      const permission: NativeTokenStreamPermission = {
        type: 'native-token-stream',
        data: {
          initialAmount: '0x1000000000000000000000000000000000000000',
          maxAmount: '0x1000000000000000000000000000000000000000',
          amountPerSecond: '0x1000000000000000000000000000000000000000',
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
        getAccountAddress: jest.fn(
          () => alreadyPopulatedContext.accountDetails.address,
        ),
      } as unknown as jest.Mocked<AccountController>;

      mockTokenMetadataService = {
        getTokenBalanceAndMetadata: jest.fn(() => ({
          balance: BigInt(alreadyPopulatedContext.accountDetails.balance),
          symbol: alreadyPopulatedContext.tokenMetadata.symbol,
          decimals: 18,
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
      expiry: convertTimestampToReadableDate(Date.now() / 1000 + 24 * 60 * 60), // 24 hours from now
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
        amountPerSecond: '0.5',
        validationErrors: {},
      });
    });

    describe('initialAmount validation', () => {
      it.each([['0x1234'], ['Steve']])(
        'should return a validation error for invalid initial amount %s',
        async (initialAmount) => {
          const contextWithInvalidInitialAmount = {
            ...context,
            permissionDetails: {
              ...context.permissionDetails,
              initialAmount,
            },
          };

          const metadata = await deriveMetadata({
            context: contextWithInvalidInitialAmount,
          });

          expect(metadata.validationErrors).toStrictEqual({
            initialAmountError: 'Invalid initial amount',
          });
        },
      );

      it('should return a validation error for negative initial amount', async () => {
        const contextWithNegativeInitialAmount = {
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            initialAmount: '-1',
          },
        };

        const metadata = await deriveMetadata({
          context: contextWithNegativeInitialAmount,
        });

        expect(metadata.validationErrors).toStrictEqual({
          initialAmountError:
            'Initial amount must be greater than or equal to 0',
        });
      });
    });

    describe('maxAmount validation', () => {
      it('should return a validation error for initial amount greater than max amount', async () => {
        const contextWithInitialAmountGreaterThanMaxAmount = {
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            initialAmount: '10',
            maxAmount: '1',
          },
        };

        const metadata = await deriveMetadata({
          context: contextWithInitialAmountGreaterThanMaxAmount,
        });

        expect(metadata.validationErrors).toStrictEqual({
          maxAmountError: 'Max amount must be greater than initial amount',
        });
      });

      it.each([['0x1234'], ['Steve']])(
        'should return a validation error for invalid max amount %s',
        async (maxAmount) => {
          const contextWithInvalidMaxAmount = {
            ...context,
            permissionDetails: {
              ...context.permissionDetails,
              maxAmount,
            },
          };

          const metadata = await deriveMetadata({
            context: contextWithInvalidMaxAmount,
          });

          expect(metadata.validationErrors).toStrictEqual({
            maxAmountError: 'Invalid max amount',
          });
        },
      );

      it('should return a validation error for negative max amount', async () => {
        const contextWithNegativeMaxAmount = {
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            maxAmount: '-1',
          },
        };

        const metadata = await deriveMetadata({
          context: contextWithNegativeMaxAmount,
        });

        expect(metadata.validationErrors).toStrictEqual({
          maxAmountError: 'Max amount must be greater than 0',
        });
      });
    });

    describe('amountPerPeriod validation', () => {
      it.each([['0x1234'], ['Steve']])(
        'should return a validation error for invalid amount per period %s',
        async (amountPerPeriod) => {
          const contextWithInvalidAmountPerPeriod = {
            ...context,
            permissionDetails: {
              ...context.permissionDetails,
              amountPerPeriod,
            },
          };

          const metadata = await deriveMetadata({
            context: contextWithInvalidAmountPerPeriod,
          });

          expect(metadata.validationErrors).toStrictEqual({
            amountPerPeriodError: 'Invalid amount per period',
          });
        },
      );

      it('should return a validation error for negative amount per period', async () => {
        const contextWithNegativeAmountPerPeriod = {
          ...context,
          permissionDetails: {
            ...context.permissionDetails,
            amountPerPeriod: '-1',
          },
        };

        const metadata = await deriveMetadata({
          context: contextWithNegativeAmountPerPeriod,
        });

        expect(metadata.validationErrors).toStrictEqual({
          amountPerPeriodError: 'Amount per period must be greater than 0',
        });
      });

      describe('startTime validation', () => {
        it('should return a validation error for startTime in the past', async () => {
          const contextWithStartTimeInThePast = {
            ...context,
            permissionDetails: {
              ...context.permissionDetails,
              startTime: '10/26/1985',
            },
          };

          const metadata = await deriveMetadata({
            context: contextWithStartTimeInThePast,
          });

          expect(metadata.validationErrors).toStrictEqual({
            startTimeError: 'Start time must be today or later',
          });
        });

        it.each([['12345678'], ['0x1234'], ['Steve']])(
          'should return a validation error for invalid startTime %s',
          async (startTime) => {
            const contextWithInvalidStartTime = {
              ...context,
              permissionDetails: {
                ...context.permissionDetails,
                startTime,
              },
            };

            const metadata = await deriveMetadata({
              context: contextWithInvalidStartTime,
            });

            expect(metadata.validationErrors).toStrictEqual({
              startTimeError: 'Invalid start time',
            });
          },
        );
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
