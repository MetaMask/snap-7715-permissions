import { describe, it, expect } from '@jest/globals';
import type {
  PermissionRequest,
  RequestExecutionPermissionsParam,
} from '@metamask/7715-permissions-shared/types';
import { InvalidInputError } from '@metamask/snaps-sdk';

import { validatePermissionRequestParam } from '../../src/utils/validate';

describe('validatePermissionRequestParam', () => {
  const validPermissionRequest: PermissionRequest = {
    chainId: '0x1',
    address: '0x1234567890123456789012345678901234567890',
    signer: {
      type: 'account',
      data: {
        address: '0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD',
      },
    },
    permission: {
      type: 'native-token-recurring-allowance',
      data: {
        ticker: 'ETH',
        amount: '0x16345785d8a0000',
      },
      isAdjustmentAllowed: true,
    },
    rules: [
      {
        type: 'expiry',
        isAdjustmentAllowed: true,
        data: {
          timestamp: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
        },
      },
    ],
  };

  const validRequestParam: RequestExecutionPermissionsParam = {
    permissionsRequest: [validPermissionRequest],
    siteOrigin: 'https://example.com',
  };

  describe('valid cases', () => {
    it('should validate a valid RequestExecutionPermissionsParam', () => {
      expect(() => {
        const result = validatePermissionRequestParam(validRequestParam);
        expect(result).toStrictEqual(validRequestParam);
      }).not.toThrow();
    });

    it('should validate with multiple permission requests', () => {
      const multiplePermissionsParam = {
        ...validRequestParam,
        permissionsRequest: [validPermissionRequest, validPermissionRequest],
      };

      expect(() => {
        const result = validatePermissionRequestParam(multiplePermissionsParam);
        expect(result).toStrictEqual(multiplePermissionsParam);
      }).not.toThrow();
    });

    it('should validate with optional address as null', () => {
      const paramWithNullAddress = {
        ...validRequestParam,
        permissionsRequest: [
          {
            ...validPermissionRequest,
            address: null,
          },
        ],
      };

      expect(() => {
        const result = validatePermissionRequestParam(paramWithNullAddress);
        expect(result).toStrictEqual(paramWithNullAddress);
      }).not.toThrow();
    });

    it('should validate with optional address omitted', () => {
      const { address, ...permissionWithoutAddress } = validPermissionRequest;
      const paramWithoutAddress = {
        ...validRequestParam,
        permissionsRequest: [permissionWithoutAddress],
      };

      expect(() => {
        const result = validatePermissionRequestParam(paramWithoutAddress);
        expect(result).toStrictEqual(paramWithoutAddress);
      }).not.toThrow();
    });

    it('should validate with ERC20 token permission', () => {
      const erc20PermissionParam = {
        ...validRequestParam,
        permissionsRequest: [
          {
            ...validPermissionRequest,
            permission: {
              type: 'erc20-token-recurring-allowance',
              isAdjustmentAllowed: true,
              data: {
                token: '0x1234567890123456789012345678901234567890',
                amount: '0x16345785d8a0000',
              },
            },
          },
        ],
      };

      expect(() => {
        const result = validatePermissionRequestParam(erc20PermissionParam);
        expect(result).toStrictEqual(erc20PermissionParam);
      }).not.toThrow();
    });

    it('should validate with expiry rule where the type descriptor is an object', () => {
      const expiryRuleParam = {
        ...validRequestParam,
        permissionsRequest: [
          {
            ...validPermissionRequest,
            rules: [
              {
                type: { name: 'expiry' },
                isAdjustmentAllowed: true,
                data: { timestamp: Math.floor(Date.now() / 1000) + 86400 },
              },
            ],
          },
        ],
      };

      expect(() => {
        const result = validatePermissionRequestParam(expiryRuleParam);
        expect(result).toStrictEqual(expiryRuleParam);
      }).not.toThrow();
    });

    it('should validate with empty rules array for supported permission type', () => {
      const withEmptyRules = {
        permissionsRequest: [
          {
            ...validPermissionRequest,
            permission: {
              type: 'native-token-stream',
              data: {
                justification: 'Test justification',
              },
              isAdjustmentAllowed: true,
            },
            rules: [],
          },
        ],
        siteOrigin: 'https://example.com',
      };
      expect(() => {
        const result = validatePermissionRequestParam(withEmptyRules);
        expect(result).toStrictEqual(withEmptyRules);
      }).not.toThrow();
    });

    it('should validate with expiry rule for supported permission type', () => {
      const withExpiryRule = {
        permissionsRequest: [
          {
            ...validPermissionRequest,
            permission: {
              type: 'native-token-stream',
              data: {
                justification: 'Test justification',
              },
              isAdjustmentAllowed: true,
            },
            rules: [
              {
                type: 'expiry',
                isAdjustmentAllowed: true,
                data: {
                  timestamp: Math.floor(Date.now() / 1000) + 86400,
                },
              },
            ],
          },
        ],
        siteOrigin: 'https://example.com',
      };
      expect(() => {
        const result = validatePermissionRequestParam(withExpiryRule);
        expect(result).toStrictEqual(withExpiryRule);
      }).not.toThrow();
    });
  });

  describe('invalid cases', () => {
    it('should throw InvalidInputError for null input', () => {
      expect(() => {
        validatePermissionRequestParam(null);
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for undefined input', () => {
      expect(() => {
        validatePermissionRequestParam(undefined);
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for empty object', () => {
      expect(() => {
        validatePermissionRequestParam({});
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for missing permissionsRequest', () => {
      expect(() => {
        validatePermissionRequestParam({
          siteOrigin: 'https://example.com',
        });
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for missing siteOrigin', () => {
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [validPermissionRequest],
        });
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for invalid siteOrigin type', () => {
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [validPermissionRequest],
          siteOrigin: 123,
        });
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for missing chainId in permission request', () => {
      const { chainId, ...invalidPermission } = validPermissionRequest;
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [invalidPermission],
          siteOrigin: 'https://example.com',
        });
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for invalid chainId format', () => {
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [
            {
              ...validPermissionRequest,
              chainId: 'invalid-chain-id',
            },
          ],
          siteOrigin: 'https://example.com',
        });
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for missing signer', () => {
      const { signer, ...invalidPermission } = validPermissionRequest;
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [invalidPermission],
          siteOrigin: 'https://example.com',
        });
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for invalid signer type', () => {
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [
            {
              ...validPermissionRequest,
              signer: {
                type: 'invalid-type',
                data: {
                  address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
                },
              },
            },
          ],
          siteOrigin: 'https://example.com',
        });
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for missing permission', () => {
      const { permission, ...invalidPermission } = validPermissionRequest;
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [invalidPermission],
          siteOrigin: 'https://example.com',
        });
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for missing rules', () => {
      const { rules, ...invalidPermission } = validPermissionRequest;
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [invalidPermission],
          siteOrigin: 'https://example.com',
        });
      }).toThrow(InvalidInputError);
    });

    it.each([
      { timestamp: 'the timestamp is not a number' },
      'the data is not an object',
      { timestamp: -1 },
      { timestamp: 0 },
      { timestamp: 0.1 },
      { data: 1234 },
    ])(
      'should throw InvalidInputError for invalid expiry rule data %s',
      (ruleData) => {
        expect(() => {
          validatePermissionRequestParam({
            permissionsRequest: [
              {
                ...validPermissionRequest,
                rules: [
                  {
                    type: 'expiry',
                    isAdjustmentAllowed: true,
                    data: ruleData,
                  },
                ],
              },
            ],
            siteOrigin: 'https://example.com',
          });
        }).toThrow(InvalidInputError);
      },
    );

    it('should throw InvalidInputError for duplicate rule types', () => {
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [
            {
              ...validPermissionRequest,
              rules: [
                {
                  type: 'expiry',
                  isAdjustmentAllowed: true,
                  data: {
                    timestamp: Math.floor(Date.now() / 1000) + 86400,
                  },
                },
                {
                  type: 'expiry',
                  isAdjustmentAllowed: true,
                  data: {
                    timestamp: Math.floor(Date.now() / 1000) + 172800,
                  },
                },
              ],
            },
          ],
          siteOrigin: 'https://example.com',
        });
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for unsupported rule type on native-token-stream', () => {
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [
            {
              ...validPermissionRequest,
              permission: {
                type: 'native-token-stream',
                data: {
                  justification: 'Test justification',
                },
                isAdjustmentAllowed: true,
              },
              rules: [
                {
                  type: 'unsupported-rule',
                  isAdjustmentAllowed: true,
                  data: {
                    someData: 'value',
                  },
                },
              ],
            },
          ],
          siteOrigin: 'https://example.com',
        });
      }).toThrow(
        'Rule type "unsupported-rule" is not supported for permission type "native-token-stream". Supported: expiry',
      );
    });

    it('should throw InvalidInputError for invalid address format', () => {
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [
            {
              ...validPermissionRequest,
              address: 'invalid-address',
            },
          ],
          siteOrigin: 'https://example.com',
        });
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for invalid signer address format', () => {
      expect(() => {
        validatePermissionRequestParam({
          permissionsRequest: [
            {
              ...validPermissionRequest,
              signer: {
                type: 'account',
                data: {
                  address: 'invalid-address',
                },
              },
            },
          ],
          siteOrigin: 'https://example.com',
        });
      }).toThrow(InvalidInputError);
    });
  });

  describe('edge cases', () => {
    it('should throw InvalidInputError for string input', () => {
      expect(() => {
        validatePermissionRequestParam('invalid string input');
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for number input', () => {
      expect(() => {
        validatePermissionRequestParam(123);
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for array input', () => {
      expect(() => {
        validatePermissionRequestParam([validRequestParam]);
      }).toThrow(InvalidInputError);
    });

    it('should throw InvalidInputError for boolean input', () => {
      expect(() => {
        validatePermissionRequestParam(true);
      }).toThrow(InvalidInputError);
    });

    it('should return the validated data when successful', () => {
      const result = validatePermissionRequestParam(validRequestParam);
      expect(result).toStrictEqual(validRequestParam);
      expect(result).toHaveProperty('permissionsRequest');
      expect(result).toHaveProperty('siteOrigin');
      expect(Array.isArray(result.permissionsRequest)).toBe(true);
      expect(typeof result.siteOrigin).toBe('string');
    });
  });
});
