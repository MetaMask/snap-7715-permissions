import { describe, expect, it } from '@jest/globals';
import { bigIntToHex } from '@metamask/utils';

import type { Erc20TokenStreamPermissionRequest } from '../../../src/permissions/erc20TokenStream/types';
import { parseAndValidate } from '../../../src/permissions/erc20TokenStream/validation';
import { MULTIPLE_ERC20_PAYEES_UNSUPPORTED_ERROR } from '../../../src/permissions/validation';
import { parseUnits } from '../../../src/utils/value';

const tokenDecimals = 10;

const validPermissionRequest: Erc20TokenStreamPermissionRequest = {
  chainId: '0x1',
  rules: [
    {
      type: 'expiry',
      data: {
        timestamp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
      },
    },
  ],
  to: '0x1',
  permission: {
    type: 'erc20-token-stream',
    data: {
      initialAmount: bigIntToHex(
        parseUnits({ formatted: '1', decimals: tokenDecimals }),
      ), // 1 token
      maxAmount: bigIntToHex(
        parseUnits({ formatted: '10', decimals: tokenDecimals }),
      ), // 10 tokens
      amountPerSecond: bigIntToHex(
        parseUnits({ formatted: '.5', decimals: tokenDecimals }),
      ), // 0.5 tokens per second
      startTime: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
      tokenAddress: '0x1234567890123456789012345678901234567890',
      justification: 'test',
    },
    isAdjustmentAllowed: true,
  },
};

describe('erc20TokenStream:validation', () => {
  describe('parseAndValidate()', () => {
    it('should validate a valid permission request', () => {
      expect(() => parseAndValidate(validPermissionRequest)).not.toThrow();

      const result = parseAndValidate(validPermissionRequest);
      expect(result).toStrictEqual(validPermissionRequest);
    });

    it('allows missing expiry', () => {
      const missingExpiryRequest = {
        ...validPermissionRequest,
        rules: [],
      };

      expect(() => parseAndValidate(missingExpiryRequest as any)).not.toThrow();
    });

    describe('payee rule validation', () => {
      it('allows one payee', () => {
        const singlePayeeRequest = {
          ...validPermissionRequest,
          rules: [
            ...validPermissionRequest.rules,
            {
              type: 'payee',
              data: {
                addresses: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
              },
            },
          ],
        };

        expect(() => parseAndValidate(singlePayeeRequest)).not.toThrow();
      });

      it('throws for multiple payees', () => {
        const multiPayeeRequest = {
          ...validPermissionRequest,
          rules: [
            ...validPermissionRequest.rules,
            {
              type: 'payee',
              data: {
                addresses: [
                  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
                ],
              },
            },
          ],
        };

        expect(() => parseAndValidate(multiPayeeRequest)).toThrow(
          MULTIPLE_ERC20_PAYEES_UNSUPPORTED_ERROR,
        );
      });
    });

    it('should throw for invalid permission type', () => {
      const invalidTypeRequest = {
        ...validPermissionRequest,
        permission: {
          ...validPermissionRequest.permission,
          type: 'invalid-type',
        },
      };

      expect(() => parseAndValidate(invalidTypeRequest as any)).toThrow(
        'Failed type validation: type: Invalid literal value, expected "erc20-token-stream"',
      );
    });

    describe('maxAmount validation', () => {
      it('should throw for zero maxAmount', () => {
        const zeroMaxAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              maxAmount: '0x0' as `0x${string}`,
            },
          },
        };

        expect(() => parseAndValidate(zeroMaxAmountRequest)).toThrow(
          'Invalid maxAmount: must be greater than 0',
        );
      });

      it('should throw when maxAmount is less than initialAmount', () => {
        const invalidMaxAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              maxAmount: bigIntToHex(
                parseUnits({ formatted: '0.5', decimals: tokenDecimals }),
              ), // 0.5 tokens
              initialAmount: bigIntToHex(
                parseUnits({ formatted: '1', decimals: tokenDecimals }),
              ), // 1 token
            },
          },
        };

        expect(() => parseAndValidate(invalidMaxAmountRequest)).toThrow(
          'Invalid maxAmount: must be greater than initialAmount',
        );
      });

      it('should allow missing maxAmount', () => {
        const noMaxAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
            },
          },
        };
        delete noMaxAmountRequest.permission.data.maxAmount;

        expect(() => parseAndValidate(noMaxAmountRequest)).not.toThrow();
      });

      it('should allow null maxAmount', () => {
        const nullMaxAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              maxAmount: null,
            },
          },
        };

        expect(() => parseAndValidate(nullMaxAmountRequest)).not.toThrow();
      });
    });

    describe('initialAmount validation', () => {
      it('should allow zero initialAmount', () => {
        const zeroInitialAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              initialAmount: '0x0' as `0x${string}`,
            },
          },
        };

        expect(() => parseAndValidate(zeroInitialAmountRequest)).not.toThrow();
      });

      it('should allow missing initialAmount', () => {
        const noInitialAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
            },
          },
        };
        delete noInitialAmountRequest.permission.data.initialAmount;

        expect(() => parseAndValidate(noInitialAmountRequest)).not.toThrow();
      });

      it('should allow null initialAmount', () => {
        const nullInitialAmountRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              initialAmount: null,
            },
          },
        };

        expect(() => parseAndValidate(nullInitialAmountRequest)).not.toThrow();

        const result = parseAndValidate(nullInitialAmountRequest);
        expect(result).toBeDefined();
      });
    });

    describe('amountPerSecond validation', () => {
      it('should throw for zero amountPerSecond', () => {
        const zeroAmountPerSecondRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              amountPerSecond: '0x0' as `0x${string}`,
            },
          },
        };

        expect(() => parseAndValidate(zeroAmountPerSecondRequest)).toThrow(
          'Invalid amountPerSecond: must be greater than 0',
        );
      });
    });

    describe('startTime validation', () => {
      it('should throw for negative startTime', () => {
        const negativeStartTimeRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: -1,
            },
          },
        };

        expect(() => parseAndValidate(negativeStartTimeRequest)).toThrow(
          'Failed type validation: data.startTime: Number must be greater than 0, data.startTime: Start time must be today or later',
        );
      });

      it('should throw for zero startTime', () => {
        const zeroStartTimeRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: 0,
            },
          },
        };

        expect(() => parseAndValidate(zeroStartTimeRequest)).toThrow(
          'Failed type validation: data.startTime: Number must be greater than 0, data.startTime: Start time must be today or later',
        );
      });

      it('should throw for non-integer startTime', () => {
        const floatStartTimeRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: Math.floor(Date.now() / 1000) + 86400 + 0.5, // Tomorrow + 0.5 seconds
            },
          },
        };

        expect(() => parseAndValidate(floatStartTimeRequest)).toThrow(
          'Failed type validation: data.startTime: Expected integer, received float',
        );
      });

      it('should allow missing startTime', () => {
        const noStartTimeRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
            },
          },
        };
        delete noStartTimeRequest.permission.data.startTime;

        expect(() => parseAndValidate(noStartTimeRequest)).not.toThrow();
      });

      it('should allow null startTime', () => {
        const nullStartTimeRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: null,
            },
          },
        };

        expect(() => parseAndValidate(nullStartTimeRequest)).not.toThrow();

        const result = parseAndValidate(nullStartTimeRequest);
        expect(result).toBeDefined();
      });
    });

    describe('startTime vs expiry validation', () => {
      it('should throw when startTime is equal to expiry', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        const startTimeVsExpiryRequest = {
          ...validPermissionRequest,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: currentTime + 86400, // 1 day from now
              },
              isAdjustmentAllowed: true,
            },
          ],
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: currentTime + 86400, // Same as expiry
            },
          },
        };

        expect(() => parseAndValidate(startTimeVsExpiryRequest)).toThrow(
          'Invalid startTime: must be before expiry',
        );
      });

      it('should throw when startTime is after expiry', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        const startTimeAfterExpiryRequest = {
          ...validPermissionRequest,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: currentTime + 86400, // 1 day from now
              },
              isAdjustmentAllowed: true,
            },
          ],
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: currentTime + 86400 * 2, // 2 days from now (after expiry)
            },
          },
        };

        expect(() => parseAndValidate(startTimeAfterExpiryRequest)).toThrow(
          'Invalid startTime: must be before expiry',
        );
      });

      it('should validate when startTime is before expiry', () => {
        const currentTime = Math.floor(Date.now() / 1000);
        const validStartTimeVsExpiryRequest = {
          ...validPermissionRequest,
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: currentTime + 86400 * 2, // 2 days from now
              },
              isAdjustmentAllowed: true,
            },
          ],
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              startTime: currentTime + 86400, // 1 day from now (before expiry)
            },
          },
        };

        expect(() =>
          parseAndValidate(validStartTimeVsExpiryRequest),
        ).not.toThrow();
      });
    });

    describe('tokenAddress validation', () => {
      it('should throw for invalid token address', () => {
        const invalidTokenAddressRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              tokenAddress: '0xinvalid',
            },
          },
        };

        expect(() => parseAndValidate(invalidTokenAddressRequest)).toThrow(
          'Failed type validation: data.tokenAddress: Invalid Ethereum address',
        );
      });

      it('should throw for zero address tokenAddress', () => {
        const zeroAddressRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
              tokenAddress:
                '0x0000000000000000000000000000000000000000' as `0x${string}`,
            },
          },
        };

        expect(() => parseAndValidate(zeroAddressRequest)).toThrow(
          'Failed type validation: data.tokenAddress: Address cannot be the zero address',
        );
      });

      it('should throw for missing token address', () => {
        const missingTokenAddressRequest = {
          ...validPermissionRequest,
          permission: {
            ...validPermissionRequest.permission,
            data: {
              ...validPermissionRequest.permission.data,
            },
          },
        };
        delete (missingTokenAddressRequest.permission.data as any).tokenAddress;

        expect(() => parseAndValidate(missingTokenAddressRequest)).toThrow(
          'Failed type validation: data.tokenAddress: Required',
        );
      });
    });
  });
});
