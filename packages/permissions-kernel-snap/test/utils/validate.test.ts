import { describe, it, expect, jest } from '@jest/globals';
import { InvalidParamsError } from '@metamask/snaps-sdk';

import { RpcMethod } from '../../src/rpc/rpcMethod';
import {
  parsePermissionRequestParam,
  parsePermissionsResponseParam,
  validateJsonRpcRequest,
  validateMethodExists,
} from '../../src/utils/validate';
import { MOCK_PERMISSIONS_REQUEST_SINGLE } from '../constants';

// Mock the logger to avoid console output during tests
jest.mock('@metamask/7715-permissions-shared/utils', () => ({
  logger: {
    warn: jest.fn(),
    debug: jest.fn(),
  },
  extractZodError: jest.fn((errors: unknown[]) =>
    errors.map((error: any) => error.message).join(', '),
  ),
}));

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
            signer: {
              type: 'account',
              data: {
                address: '0x016562aA41A8697720ce0943F003141f5dEAe006',
              },
            },
          },
        ]),
      ).toThrow('Failed type validation: 0.permission: Required');
    });

    it('throw error if params is empty', async () => {
      expect(() => parsePermissionRequestParam([])).toThrow('params are empty');
    });

    it('throw error if params is invalid type', async () => {
      expect(() => parsePermissionRequestParam('invalid')).toThrow(
        'Failed type validation',
      );
    });
  });

  describe('parsePermissionsResponseParam', () => {
    it('should return validated permissions as a PermissionsResponse object', async () => {
      const validResponse = [
        {
          chainId: '0x1',
          signer: {
            type: 'account',
            data: {
              address: '0x016562aA41A8697720ce0943F003141f5dEAe006',
            },
          },
          permission: {
            type: 'eth_signTransaction',
            isAdjustmentAllowed: true,
            data: {
              allowed: true,
            },
          },
          context: '0x1234',
          dependencyInfo: [
            {
              factory: '0x016562aA41A8697720ce0943F003141f5dEAe006',
              factoryData: '0x',
            },
          ],
          signerMeta: {
            delegationManager: '0x016562aA41A8697720ce0943F003141f5dEAe006',
          },
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
          },
        ]),
      ).toThrow('Failed type validation');
    });

    it('throw error if params is empty', async () => {
      expect(() => parsePermissionsResponseParam([])).toThrow(
        'params are empty',
      );
    });

    it('throw error if params is invalid type', async () => {
      expect(() => parsePermissionsResponseParam('invalid')).toThrow(
        'Failed type validation',
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

  describe('validateMethodExists', () => {
    const mockBoundHandlers = {
      [RpcMethod.WalletRequestExecutionPermissions]: jest.fn(),
    };

    it('should not throw for existing method', () => {
      expect(() =>
        validateMethodExists(
          RpcMethod.WalletRequestExecutionPermissions,
          mockBoundHandlers,
        ),
      ).not.toThrow();
    });

    it('should throw InvalidParamsError for non-existing method', () => {
      expect(() =>
        validateMethodExists('non_existing_method', mockBoundHandlers),
      ).toThrow(InvalidParamsError);
    });

    it('should not be vulnerable to prototype pollution', () => {
      // Test that the function uses Object.prototype.hasOwnProperty.call correctly
      // by ensuring it doesn't find methods that don't actually exist on the object
      expect(() =>
        validateMethodExists('nonExistentMethod', mockBoundHandlers),
      ).toThrow(InvalidParamsError);

      // Test that it correctly finds existing methods
      expect(() =>
        validateMethodExists(
          RpcMethod.WalletRequestExecutionPermissions,
          mockBoundHandlers,
        ),
      ).not.toThrow();
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

      const mockBoundHandlers = {
        [RpcMethod.WalletRequestExecutionPermissions]: jest.fn(),
      };

      // Validate request
      const validatedRequest = validateJsonRpcRequest(validRequest);

      // Validate method exists
      validateMethodExists(validatedRequest.method, mockBoundHandlers);

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
