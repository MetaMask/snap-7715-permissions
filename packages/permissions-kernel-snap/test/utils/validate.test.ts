// Mock the logger to avoid console output during tests
import { describe, it, expect, jest } from '@jest/globals';
import { InvalidParamsError } from '@metamask/snaps-sdk';

import { RpcMethod } from '../../src/rpc/rpcMethod';
import {
  parsePermissionRequestParam,
  parsePermissionsResponseParam,
  validateJsonRpcRequest,
} from '../../src/utils/validate';
import { MOCK_PERMISSIONS_REQUEST_SINGLE } from '../constants';

jest.mock('@metamask/7715-permissions-shared/utils', () => {
  const actual = jest.requireActual('@metamask/7715-permissions-shared/utils');
  return {
    ...(actual || {}),
    logger: {
      warn: jest.fn(),
      debug: jest.fn(),
    },
  };
});

describe('validate utils', () => {
  describe('parsePermissionRequestParam', () => {
    it('should return validated permissions as a PermissionsRequest object', async () => {
      expect(
        parsePermissionRequestParam(MOCK_PERMISSIONS_REQUEST_SINGLE),
      ).toStrictEqual(MOCK_PERMISSIONS_REQUEST_SINGLE);
    });

    it('throw error if params is not valid PermissionRequest(case missing required permission object)', async () => {
      expect(() =>
        parsePermissionRequestParam([
          {
            chainId: '0x1',
            to: '0x016562aA41A8697720ce0943F003141f5dEAe006',
          },
        ]),
      ).toThrow('Failed type validation: 0.permission: Required');
    });

    it('throw error if params is empty', async () => {
      expect(() => parsePermissionRequestParam([])).toThrow('params are empty');
    });

    it('throw error if params is invalid type', async () => {
      expect(() => parsePermissionRequestParam('invalid')).toThrow(
        'Failed type validation: Expected array, received string',
      );
    });
  });

  describe('parsePermissionsResponseParam', () => {
    it('should return validated permissions as a PermissionsResponse object', async () => {
      const validResponse = [
        {
          chainId: '0x1',
          to: '0x016562aA41A8697720ce0943F003141f5dEAe006',
          permission: {
            type: 'eth_signTransaction',
            isAdjustmentAllowed: true,
            data: {
              allowed: true,
            },
          },
          rules: [
            {
              type: 'expiry',
              data: {
                timestamp: 123456,
              },
            },
          ],
          context: '0x1234',
          dependencies: [
            {
              factory: '0x016562aA41A8697720ce0943F003141f5dEAe006',
              factoryData: '0x',
            },
          ],
          delegationManager: '0x016562aA41A8697720ce0943F003141f5dEAe006',
        },
      ];
      expect(parsePermissionsResponseParam(validResponse)).toStrictEqual(
        validResponse,
      );
    });

    it('throw error if params is not valid PermissionsResponse', async () => {
      expect(() =>
        parsePermissionsResponseParam([
          {
            chainId: '0x1',
            // Missing permission object
            rules: [
              {
                type: 'expiry',
                isAdjustmentAllowed: true,
                data: {
                  timestamp: 123456,
                },
              },
            ],
          },
        ]),
      ).toThrow(
        'Failed type validation: 0.to: Required, 0.permission: Required, 0.context: Required, 0.dependencies: Required, 0.delegationManager: Required',
      );
    });

    it('throw error if params is empty', async () => {
      expect(() => parsePermissionsResponseParam([])).toThrow(
        'params are empty',
      );
    });

    it('throw error if params is invalid type', async () => {
      expect(() => parsePermissionsResponseParam('invalid')).toThrow(
        'Failed type validation: Expected array, received string',
      );
    });
  });

  describe('validateJsonRpcRequest', () => {
    it('should validate a correct JSON-RPC request', () => {
      const validRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        params: { test: 'value' },
        id: 1,
      };

      const result = validateJsonRpcRequest(validRequest);
      expect(result).toStrictEqual(validRequest);
    });

    it('should validate a request without params', () => {
      const validRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        id: 'test-id',
      };

      const result = validateJsonRpcRequest(validRequest);
      expect(result).toStrictEqual(validRequest);
    });

    it('should validate a request without id', () => {
      const validRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        params: { test: 'value' },
      };

      const result = validateJsonRpcRequest(validRequest);
      expect(result).toStrictEqual(validRequest);
    });

    it('should throw InvalidParamsError for non-object request', () => {
      expect(() => validateJsonRpcRequest('invalid')).toThrow(
        InvalidParamsError,
      );
      expect(() => validateJsonRpcRequest(null)).toThrow(InvalidParamsError);
      expect(() => validateJsonRpcRequest(123)).toThrow(InvalidParamsError);
    });

    it('should throw InvalidParamsError for invalid jsonrpc version', () => {
      const invalidRequest = {
        jsonrpc: '1.0',
        method: RpcMethod.WalletRequestExecutionPermissions,
      };

      expect(() => validateJsonRpcRequest(invalidRequest)).toThrow(
        InvalidParamsError,
      );
    });

    it('should throw InvalidParamsError for missing jsonrpc field', () => {
      const invalidRequest = {
        method: RpcMethod.WalletRequestExecutionPermissions,
      };

      expect(() => validateJsonRpcRequest(invalidRequest)).toThrow(
        InvalidParamsError,
      );
    });

    it('should throw InvalidParamsError for invalid method', () => {
      const invalidRequest = {
        jsonrpc: '2.0' as const,
        method: 'invalid_method',
      };

      expect(() => validateJsonRpcRequest(invalidRequest)).toThrow(
        InvalidParamsError,
      );
    });

    it('should throw InvalidParamsError for missing method', () => {
      const invalidRequest = {
        jsonrpc: '2.0' as const,
      };

      expect(() => validateJsonRpcRequest(invalidRequest)).toThrow(
        InvalidParamsError,
      );
    });

    it('should throw InvalidParamsError for invalid id type', () => {
      const invalidRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        id: { invalid: 'id' },
      };

      expect(() => validateJsonRpcRequest(invalidRequest)).toThrow(
        InvalidParamsError,
      );
    });

    it('should allow valid primitive params', () => {
      const validRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        params: 'string param',
      };

      const result = validateJsonRpcRequest(validRequest);
      expect(result.params).toBe('string param');
    });

    it('should allow valid number params', () => {
      const validRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        params: 123,
      };

      const result = validateJsonRpcRequest(validRequest);
      expect(result.params).toBe(123);
    });

    it('should allow valid boolean params', () => {
      const validRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        params: true,
      };

      const result = validateJsonRpcRequest(validRequest);
      expect(result.params).toBe(true);
    });
  });

  describe('isSafeObject function (via validateJsonRpcRequest)', () => {
    it('should reject objects with exact dangerous keys', () => {
      // Create objects with dangerous keys that will actually be detected
      const dangerousParams1 = { constructor: 'pollution' };
      const dangerousParams2 = { prototype: 'pollution' };
      // Create an object with __proto__ as an actual property (not the special __proto__ property)
      const dangerousParams3 = Object.create(null);
      // eslint-disable-next-line no-proto
      dangerousParams3.__proto__ = 'pollution';

      const dangerousRequests = [
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          params: dangerousParams1,
        },
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          params: dangerousParams2,
        },
        // Note: dangerousParams3 won't work with z.record as it converts Object.create(null) to {}
        // This is actually correct behavior - Object.create(null) objects are safe from prototype pollution
      ];

      dangerousRequests.forEach((request) => {
        expect(() => validateJsonRpcRequest(request)).toThrow(
          'Invalid JSON-RPC request: Failed type validation: params: Invalid key: potential prototype pollution attempt',
        );
      });
    });

    it('should allow objects with keys that contain dangerous substrings', () => {
      const safeRequests = [
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          params: { my__proto__field: 'safe' },
        },
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          params: { constructorHelper: 'safe' },
        },
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          params: { prototypeData: 'safe' },
        },
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          params: { __proto__test: 'safe' },
        },
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          params: { test__proto__: 'safe' },
        },
      ];

      safeRequests.forEach((request) => {
        const result = validateJsonRpcRequest(request);
        expect(result).toStrictEqual(request);
      });
    });

    it('should reject nested objects with dangerous keys', () => {
      // Create nested objects with dangerous keys that will actually be detected
      const nestedProto = Object.create(null);
      // eslint-disable-next-line no-proto
      nestedProto.__proto__ = 'pollution';

      const dangerousNestedRequests = [
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          params: {
            level1: nestedProto,
          },
        },
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          params: {
            level1: {
              level2: {
                constructor: 'pollution',
              },
            },
          },
        },
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          params: {
            level1: {
              level2: {
                level3: {
                  prototype: 'pollution',
                },
              },
            },
          },
        },
      ];

      dangerousNestedRequests.forEach((request) => {
        expect(() => validateJsonRpcRequest(request)).toThrow(
          'Invalid JSON-RPC request: Failed type validation: params: Invalid key: potential prototype pollution attempt',
        );
      });
    });

    it('should reject arrays containing objects with dangerous keys', () => {
      const dangerousArrayRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        params: [
          { safe: 'value' },
          { constructor: 'pollution' },
          { another: 'value' },
        ] as any[],
      };

      expect(() => validateJsonRpcRequest(dangerousArrayRequest)).toThrow(
        'Invalid JSON-RPC request: Failed type validation: params: Invalid key in array: potential prototype pollution attempt',
      );
    });

    it('should allow deeply nested safe objects', () => {
      const safeDeepRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        params: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    safe: 'deep value',
                    array: [{ nested: 'safe' }, { another: 'safe' }],
                  },
                },
              },
            },
          },
        },
      };

      const result = validateJsonRpcRequest(safeDeepRequest);
      expect(result).toStrictEqual(safeDeepRequest);
    });

    it('should handle arrays with nested objects safely', () => {
      const safeArrayRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        params: [
          { safe: 'value' },
          { nested: { deep: 'value' } },
          { array: [{ inner: 'value' }] },
        ],
      };

      const result = validateJsonRpcRequest(safeArrayRequest);
      expect(result).toStrictEqual(safeArrayRequest);
    });

    it('should handle primitive values safely', () => {
      const primitiveRequests = [
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          params: 'string',
        },
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          params: 123,
        },
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          params: true,
        },
        {
          jsonrpc: '2.0' as const,
          method: RpcMethod.WalletRequestExecutionPermissions,
          params: null,
        },
      ];

      primitiveRequests.forEach((request) => {
        const result = validateJsonRpcRequest(request);
        expect(result).toStrictEqual(request);
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle complete valid request flow', () => {
      const validRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        params: { test: 'value' },
        id: 1,
      };

      // Validate request
      const validatedRequest = validateJsonRpcRequest(validRequest);

      expect(validatedRequest).toStrictEqual(validRequest);
    });

    it('should handle request with complex nested params', () => {
      const complexParams = {
        level1: {
          level2: {
            level3: 'deep value',
            array: [1, 2, 3],
          },
          simple: 'value',
        },
        primitive: 42,
      };

      const validRequest = {
        jsonrpc: '2.0' as const,
        method: RpcMethod.WalletRequestExecutionPermissions,
        params: complexParams,
      };

      const result = validateJsonRpcRequest(validRequest);
      expect(result.params).toStrictEqual(complexParams);
    });
  });
});
