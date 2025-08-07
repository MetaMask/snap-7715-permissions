import { describe, expect, beforeEach, it } from '@jest/globals';
import { bigIntToHex, numberToHex } from '@metamask/utils';

import { TimePeriod } from '../../../src/core/types';
import {
  populatePermission,
  buildContext,
  deriveMetadata,
  applyContext,
} from '../../../src/permissions/erc20TokenStream/context';
import type {
  Erc20TokenStreamContext,
  Erc20TokenStreamPermission,
  Erc20TokenStreamPermissionRequest,
} from '../../../src/permissions/erc20TokenStream/types';
import type { TokenMetadataService } from '../../../src/services/tokenMetadataService';
import { convertReadableDateToTimestamp } from '../../../src/utils/time';

const ACCOUNT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const USDC_ADDRESS = '0xA0b86a33E6417efb4e0Ba2b1e4E6FE87bbEf2B0F';
const USDC_DECIMALS = 6;

const permissionWithoutOptionals: Erc20TokenStreamPermission = {
  type: 'erc20-token-stream',
  data: {
    tokenAddress: USDC_ADDRESS,
    amountPerSecond: numberToHex(500_000), // 0.5 USDC per second (6 decimals)
    startTime: 1729987200, // 10/26/2024,
    justification: 'Permission to do something important',
  },
  isAdjustmentAllowed: true,
};

const alreadyPopulatedPermission: Erc20TokenStreamPermission = {
  ...permissionWithoutOptionals,
  data: {
    ...permissionWithoutOptionals.data,
    // 1 USDC
    initialAmount: numberToHex(1_000_000),
    // 10 USDC
    maxAmount: numberToHex(10_000_000),
  },
};

const alreadyPopulatedPermissionRequest: Erc20TokenStreamPermissionRequest = {
  address: ACCOUNT_ADDRESS,
  chainId: '0x1',
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
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: convertReadableDateToTimestamp('05/01/2024'),
      },
      isAdjustmentAllowed: true,
    },
  ],
};

const alreadyPopulatedContext: Erc20TokenStreamContext = {
  expiry: {
    timestamp: '1714521600',
    isAdjustmentAllowed: true,
  },
  isAdjustmentAllowed: true,
  justification: 'Permission to do something important',
  accountAddressCaip10: `eip155:1:${ACCOUNT_ADDRESS}`,
  tokenAddressCaip19: `eip155:1/erc20:${USDC_ADDRESS}`,
  tokenMetadata: {
    symbol: 'USDC',
    decimals: USDC_DECIMALS,
    iconDataBase64: null,
  },
  permissionDetails: {
    initialAmount: '1',
    maxAmount: '10',
    timePeriod: TimePeriod.WEEKLY,
    startTime: '1729900800',
    amountPerPeriod: '302400',
  },
} as const;

describe('erc20TokenStream:context', () => {
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
          maxAmount:
            '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        },
        isAdjustmentAllowed: true,
      });
    });

    it('should set startTime to current timestamp when it is null', async () => {
      const beforeTime = Math.floor(Date.now() / 1000);

      const permission: Erc20TokenStreamPermission = {
        type: 'erc20-token-stream',
        data: {
          tokenAddress: USDC_ADDRESS,
          initialAmount: '0x1000000000000000000000000000000000000000',
          maxAmount: '0x1000000000000000000000000000000000000000',
          amountPerSecond: '0x1000000000000000000000000000000000000000',
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
            alreadyPopulatedContext.permissionDetails.initialAmount ?? 0,
          ),
          symbol: alreadyPopulatedContext.tokenMetadata.symbol,
          decimals: USDC_DECIMALS,
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
        assetAddress: USDC_ADDRESS,
      });
    });

    it('should create a context with different token decimals', async () => {
      const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
      const DAI_DECIMALS = 18;
      const DAI_BALANCE = bigIntToHex(100000000000000000000n); // 100 DAI (18 decimals)

      const daiPermission: Erc20TokenStreamPermission = {
        type: 'erc20-token-stream',
        data: {
          tokenAddress: DAI_ADDRESS,
          amountPerSecond: bigIntToHex(500000000000000000n), // 0.5 DAI per second (18 decimals)
          startTime: 499132800,
          initialAmount: bigIntToHex(1000000000000000000n), // 1 DAI
          maxAmount: bigIntToHex(10000000000000000000n), // 10 DAI
          justification: 'Permission to do something important',
        },
        isAdjustmentAllowed: true,
      };

      const daiPermissionRequest: Erc20TokenStreamPermissionRequest = {
        ...alreadyPopulatedPermissionRequest,
        permission: daiPermission,
      };

      // Override mock return values for this test
      mockTokenMetadataService.getTokenBalanceAndMetadata.mockResolvedValueOnce(
        {
          balance: BigInt(DAI_BALANCE),
          symbol: 'DAI',
          decimals: DAI_DECIMALS,
        },
      );

      const context = await buildContext({
        permissionRequest: daiPermissionRequest,
        tokenMetadataService: mockTokenMetadataService,
      });

      expect(context.tokenMetadata).toStrictEqual({
        symbol: 'DAI',
        decimals: DAI_DECIMALS,
        iconDataBase64: null,
      });

      expect(context.permissionDetails.initialAmount).toBe('1');
      expect(context.permissionDetails.maxAmount).toBe('10');
    });
  });

  describe('createContextMetadata()', () => {
    const dateInTheFuture = (
      Math.floor(Date.now() / 1000) +
      24 * 60 * 60
    ).toString(); // 24 hours from now
    const startTime = (Math.floor(Date.now() / 1000) + 12 * 60 * 60).toString(); // 12 hours from now
    const context = {
      ...alreadyPopulatedContext,
      expiry: {
        timestamp: dateInTheFuture, // 24 hours from now
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
          async (startTimeArg) => {
            const contextWithInvalidStartTime = {
              ...context,
              permissionDetails: {
                ...context.permissionDetails,
                startTime: startTimeArg,
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
          expiry: {
            timestamp: '10/26/1985',
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

      it.each([['12345678'], ['0x1234'], ['Steve']])(
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
