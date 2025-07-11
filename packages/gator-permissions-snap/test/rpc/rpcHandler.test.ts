import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import type {
  PermissionRequest,
  PermissionResponse,
} from '@metamask/7715-permissions-shared/types';
import type { Json } from '@metamask/snaps-sdk';

import type { PermissionHandlerFactory } from '../../src/core/permissionHandlerFactory';
import type { PermissionHandlerType } from '../../src/core/types';
import type { ProfileSyncManager } from '../../src/profileSync';
import { createRpcHandler, type RpcHandler } from '../../src/rpc/rpcHandler';

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890' as const;
const TEST_SITE_ORIGIN = 'https://example.com';
const TEST_CHAIN_ID = '0x1' as const;
const TEST_EXPIRY = 1234567890;
const TEST_CONTEXT = '0xabcd' as const;

const VALID_PERMISSION_REQUEST: PermissionRequest = {
  chainId: TEST_CHAIN_ID,
  expiry: TEST_EXPIRY,
  signer: {
    type: 'account',
    data: { address: TEST_ADDRESS },
  },
  permission: {
    type: 'test-permission',
    data: {
      justification: 'Testing permission request',
    },
  },
};

const VALID_REQUEST: Json = {
  permissionsRequest: [VALID_PERMISSION_REQUEST] as unknown as Json[],
  siteOrigin: TEST_SITE_ORIGIN,
};

const VALID_PERMISSION_RESPONSE: PermissionResponse = {
  chainId: TEST_CHAIN_ID,
  expiry: TEST_EXPIRY,
  signer: {
    type: 'account',
    data: { address: TEST_ADDRESS },
  },
  permission: {
    type: 'test-permission',
    data: { justification: 'Testing permission request' },
  },
  context: TEST_CONTEXT,
  accountMeta: [],
  signerMeta: {
    delegationManager: TEST_ADDRESS,
  },
};

const MOCK_SUCCESS_RESPONSE = {
  approved: true,
  response: VALID_PERMISSION_RESPONSE,
} as const;

describe('RpcHandler', () => {
  let handler: RpcHandler;
  let mockHandler: jest.Mocked<PermissionHandlerType>;
  let mockHandlerFactory: jest.Mocked<PermissionHandlerFactory>;
  let mockProfileSyncManager: jest.Mocked<ProfileSyncManager>;

  beforeEach(() => {
    mockHandler = {
      handlePermissionRequest: jest.fn(),
    } as unknown as jest.Mocked<PermissionHandlerType>;

    mockHandlerFactory = {
      createPermissionHandler: jest.fn().mockReturnValue(mockHandler),
    } as unknown as jest.Mocked<PermissionHandlerFactory>;
    mockProfileSyncManager = {
      revokeGrantedPermission: jest.fn(),
      storeGrantedPermission: jest.fn(),
      storeGrantedPermissionBatch: jest.fn(),
      getGrantedPermission: jest.fn(),
      getAllGrantedPermissions: jest.fn(),
      getUserProfile: jest.fn(),
    } as unknown as jest.Mocked<ProfileSyncManager>;

    handler = createRpcHandler({
      permissionHandlerFactory: mockHandlerFactory,
      profileSyncManager: mockProfileSyncManager,
    });
  });

  describe('grantPermission', () => {
    it('should handle a single permission request successfully', async () => {
      mockHandler.handlePermissionRequest.mockImplementation(
        async () => MOCK_SUCCESS_RESPONSE,
      );

      const result = await handler.grantPermission(VALID_REQUEST);

      expect(mockHandlerFactory.createPermissionHandler).toHaveBeenCalledTimes(
        1,
      );

      expect(mockHandlerFactory.createPermissionHandler).toHaveBeenCalledWith(
        VALID_PERMISSION_REQUEST,
      );

      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledTimes(1);
      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledWith(
        TEST_SITE_ORIGIN,
      );

      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE]);
    });

    it('should throw an error if no parameters are provided', async () => {
      await expect(handler.grantPermission()).rejects.toThrow(
        'Failed type validation: : Required',
      );
    });

    it('should throw an error if permissionsRequest is missing', async () => {
      await expect(
        handler.grantPermission({
          siteOrigin: TEST_SITE_ORIGIN,
        } as unknown as Json),
      ).rejects.toThrow('Failed type validation: permissionsRequest: Required');
    });

    it('should throw an error if siteOrigin is missing', async () => {
      await expect(
        handler.grantPermission({
          ...VALID_REQUEST,
          siteOrigin: undefined,
        } as unknown as Json),
      ).rejects.toThrow('Failed type validation: siteOrigin: Required');
    });

    it('should resolve to an empty response if permissionsRequest is empty array', async () => {
      expect(
        await handler.grantPermission({
          permissionsRequest: [],
          siteOrigin: TEST_SITE_ORIGIN,
        } as unknown as Json),
      ).toStrictEqual([]);
    });

    it('should handle multiple permission requests in parallel', async () => {
      const secondPermissionRequest = {
        ...VALID_PERMISSION_REQUEST,
        chainId: '0x2' as const,
      };

      const secondResponse = {
        ...VALID_PERMISSION_RESPONSE,
        chainId: '0x2' as const,
      };

      const request: Json = {
        permissionsRequest: [
          VALID_PERMISSION_REQUEST,
          secondPermissionRequest,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockHandler.handlePermissionRequest
        .mockImplementationOnce(async () => MOCK_SUCCESS_RESPONSE)
        .mockImplementationOnce(async () => ({
          approved: true,
          response: secondResponse,
        }));

      const result = await handler.grantPermission(request);

      expect(mockHandlerFactory.createPermissionHandler).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockHandlerFactory.createPermissionHandler,
      ).toHaveBeenNthCalledWith(1, VALID_PERMISSION_REQUEST);
      expect(
        mockHandlerFactory.createPermissionHandler,
      ).toHaveBeenNthCalledWith(2, secondPermissionRequest);

      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledTimes(2);
      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledWith(
        TEST_SITE_ORIGIN,
      );

      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE, secondResponse]);
    });

    it('should handle mixed success/failure responses for multiple requests', async () => {
      const secondPermissionRequest = {
        ...VALID_PERMISSION_REQUEST,
        chainId: '0x2' as const,
      };

      const request: Json = {
        permissionsRequest: [
          VALID_PERMISSION_REQUEST,
          secondPermissionRequest,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockHandler.handlePermissionRequest
        .mockImplementationOnce(async () => MOCK_SUCCESS_RESPONSE)
        .mockImplementationOnce(async () => ({
          approved: false,
          reason: 'User rejected the permissions request',
        }));

      await expect(handler.grantPermission(request)).rejects.toThrow(
        'User rejected the permissions request',
      );

      expect(mockHandlerFactory.createPermissionHandler).toHaveBeenCalledTimes(
        2,
      );
      expect(mockHandler.handlePermissionRequest).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if orchestrator creation fails', async () => {
      mockHandlerFactory.createPermissionHandler.mockImplementation(() => {
        throw new Error('Failed to create orchestrator');
      });

      await expect(handler.grantPermission(VALID_REQUEST)).rejects.toThrow(
        'Failed to create orchestrator',
      );
    });

    it('should throw an error if orchestration fails', async () => {
      mockHandler.handlePermissionRequest.mockImplementation(async () => ({
        approved: false,
        reason: 'Orchestration failed',
      }));

      await expect(handler.grantPermission(VALID_REQUEST)).rejects.toThrow(
        'Orchestration failed',
      );
    });

    it('should handle permission requests with optional fields missing', async () => {
      const requestWithoutOptionals = {
        ...VALID_PERMISSION_REQUEST,
        isAdjustmentAllowed: undefined,
      };

      const request: Json = {
        permissionsRequest: [requestWithoutOptionals] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockHandler.handlePermissionRequest.mockImplementation(
        async () => MOCK_SUCCESS_RESPONSE,
      );

      const result = await handler.grantPermission(request);
      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE]);
    });

    it('should handle permission requests with all optional fields present', async () => {
      const requestWithOptionals = {
        ...VALID_PERMISSION_REQUEST,
        isAdjustmentAllowed: true,
        address: TEST_ADDRESS,
      };

      const request: Json = {
        permissionsRequest: [requestWithOptionals] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockHandler.handlePermissionRequest.mockImplementation(
        async () => MOCK_SUCCESS_RESPONSE,
      );

      const result = await handler.grantPermission(request);
      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE]);
    });

    it('should handle requests with different permission types', async () => {
      const differentPermissionRequest = {
        ...VALID_PERMISSION_REQUEST,
        permission: {
          type: 'different-permission',
          data: {
            justification: 'Testing different permission type',
          },
        },
      };

      const differentResponse = {
        ...VALID_PERMISSION_RESPONSE,
        permission: {
          type: 'different-permission',
          data: {
            justification: 'Testing different permission type',
          },
        },
      };

      const request: Json = {
        permissionsRequest: [differentPermissionRequest] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      mockHandler.handlePermissionRequest.mockImplementation(async () => ({
        approved: true,
        response: differentResponse,
      }));

      const result = await handler.grantPermission(request);
      expect(result).toStrictEqual([differentResponse]);
    });

    it('should maintain response order matching request order', async () => {
      const secondPermissionRequest = {
        ...VALID_PERMISSION_REQUEST,
        chainId: '0x2' as const,
      };

      const secondResponse = {
        ...VALID_PERMISSION_RESPONSE,
        chainId: '0x2' as const,
      };

      const request: Json = {
        permissionsRequest: [
          VALID_PERMISSION_REQUEST,
          secondPermissionRequest,
        ] as unknown as Json[],
        siteOrigin: TEST_SITE_ORIGIN,
      };

      // Simulate async responses resolving in reverse order
      mockHandler.handlePermissionRequest
        .mockImplementationOnce(
          async () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(MOCK_SUCCESS_RESPONSE), 100),
            ),
        )
        .mockImplementationOnce(async () => ({
          approved: true,
          response: secondResponse,
        }));

      const result = await handler.grantPermission(request);
      expect(result).toStrictEqual([VALID_PERMISSION_RESPONSE, secondResponse]);
    });
  });

  describe('getPermissionOffers', () => {
    it('should return the default permission offers', async () => {
      const result = await handler.getPermissionOffers();
      expect(result).toStrictEqual([
        {
          proposedName: 'Native Token Stream',
          type: 'native-token-stream',
        },
        {
          proposedName: 'Native Token Periodic Transfer',
          type: 'native-token-periodic',
        },
        {
          proposedName: 'ERC20 Token Stream',
          type: 'erc20-token-stream',
        },
        {
          proposedName: 'ERC20 Token Periodic Transfer',
          type: 'erc20-token-periodic',
        },
      ]);
    });
  });

  describe('getGrantedPermissions', () => {
    it('should return all granted permissions successfully', async () => {
      const mockGrantedPermissions = [
        {
          permissionResponse: {
            chainId: TEST_CHAIN_ID,
            expiry: TEST_EXPIRY,
            signer: {
              type: 'account' as const,
              data: { address: TEST_ADDRESS },
            },
            permission: {
              type: 'test-permission',
              data: { justification: 'Testing permission request' },
            },
            context: TEST_CONTEXT,
            accountMeta: [],
            signerMeta: {
              delegationManager: TEST_ADDRESS,
            },
          },
          siteOrigin: TEST_SITE_ORIGIN,
        },
        {
          permissionResponse: {
            chainId: '0x2' as const,
            expiry: TEST_EXPIRY + 1000,
            signer: {
              type: 'account' as const,
              data: {
                address: '0x0987654321098765432109876543210987654321' as const,
              },
            },
            permission: {
              type: 'different-permission',
              data: { justification: 'Another permission' },
            },
            context: '0xefgh' as const,
            accountMeta: [],
            signerMeta: {
              delegationManager:
                '0x0987654321098765432109876543210987654321' as const,
            },
          },
          siteOrigin: 'https://another-example.com',
        },
      ];

      mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue(
        mockGrantedPermissions,
      );

      const result = await handler.getGrantedPermissions();

      expect(
        mockProfileSyncManager.getAllGrantedPermissions,
      ).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual(mockGrantedPermissions);
    });

    it('should return empty array when no permissions are granted', async () => {
      mockProfileSyncManager.getAllGrantedPermissions.mockResolvedValue([]);

      const result = await handler.getGrantedPermissions();

      expect(
        mockProfileSyncManager.getAllGrantedPermissions,
      ).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual([]);
    });

    it('should handle errors from profile sync manager', async () => {
      const errorMessage = 'Failed to retrieve granted permissions';
      mockProfileSyncManager.getAllGrantedPermissions.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(handler.getGrantedPermissions()).rejects.toThrow(
        errorMessage,
      );
      expect(
        mockProfileSyncManager.getAllGrantedPermissions,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
