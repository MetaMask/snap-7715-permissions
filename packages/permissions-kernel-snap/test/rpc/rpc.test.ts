import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type {
  GetSupportedPermissionsResult,
  PermissionsRequest,
  PermissionsResponse,
} from '@metamask/7715-permissions-shared/types';
import type { Json } from '@metamask/snaps-sdk';

import type { PermissionOfferRegistryManager } from '../../src/registryManager';
import { createRpcHandler, type RpcHandler } from '../../src/rpc/rpcHandler';
import { ExternalMethod } from '../../src/rpc/rpcMethod';

describe('RpcHandler', () => {
  let handler: RpcHandler;
  const mockSnapsProvider = createMockSnapsProvider();
  const mockPermissionOfferRegistryManager = {
    buildPermissionOffersRegistry: jest.fn(),
    findRelevantPermissionsToGrant: jest.fn(),
    getRegisteredPermissionOffers: jest.fn(),
  } as unknown as jest.Mocked<PermissionOfferRegistryManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = createRpcHandler({
      snapsProvider: mockSnapsProvider,
      permissionOfferRegistryManager: mockPermissionOfferRegistryManager,
    });
  });

  describe('grantPermissions', () => {
    const siteOrigin = 'https://example.com';
    const mockPermissions: PermissionsRequest = [
      {
        chainId: '0x1',
        signer: {
          type: 'account',
          data: {
            address: '0x1234567890123456789012345678901234567890',
          },
        },
        permission: {
          type: 'native-token-transfer',
          isAdjustmentAllowed: true,
          data: {
            justification: 'Test permission',
            allowance: '0x1000',
          },
        },
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
    ];

    /**
     * Helper function to set up successful permission flow mocks.
     * This reduces test duplication by centralizing common mock setup.
     */
    const setupSuccessfulPermissionFlow = () => {
      mockPermissionOfferRegistryManager.buildPermissionOffersRegistry.mockResolvedValue(
        {
          'test-provider': [],
        },
      );
      mockPermissionOfferRegistryManager.getRegisteredPermissionOffers.mockReturnValue(
        [],
      );
      mockPermissionOfferRegistryManager.findRelevantPermissionsToGrant.mockReturnValue(
        {
          permissionsToGrant: mockPermissions,
          missingPermissions: [],
        },
      );
    };

    it('should throw error when permissions provider does not support all requested permissions', async () => {
      const mockPartialPermissions: PermissionsRequest = [
        {
          chainId: '0x1',
          signer: {
            type: 'account',
            data: {
              address: '0x1234567890123456789012345678901234567890',
            },
          },
          permission: {
            type: 'native-token-transfer',
            isAdjustmentAllowed: true,
            data: {
              justification: 'Test permission',
              allowance: '0x1000',
            },
          },
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
      ];

      mockPermissionOfferRegistryManager.buildPermissionOffersRegistry.mockResolvedValue(
        {
          'test-provider': [],
        },
      );
      mockPermissionOfferRegistryManager.getRegisteredPermissionOffers.mockReturnValue(
        [],
      );
      // Return only one permission when two were requested
      mockPermissionOfferRegistryManager.findRelevantPermissionsToGrant.mockReturnValue(
        {
          permissionsToGrant: [
            mockPartialPermissions[0],
          ] as unknown as PermissionsRequest,
          missingPermissions: [
            mockPartialPermissions[1],
          ] as unknown as PermissionsRequest,
          errorMessage:
            'The following permissions can not be granted by the permissions provider: native-token-stream',
        },
      );

      await expect(
        handler.requestExecutionPermissions({
          siteOrigin,
          params: mockPartialPermissions as unknown as Json,
        }),
      ).rejects.toThrow(
        'The following permissions can not be granted by the permissions provider: native-token-stream',
      );
    });

    it('should successfully grant permissions', async () => {
      const mockGrantedPermissions: PermissionsResponse = [
        {
          chainId: '0x1',
          signer: {
            type: 'account',
            data: {
              address: '0x1234567890123456789012345678901234567890',
            },
          },
          permission: {
            type: 'native-token-transfer',
            isAdjustmentAllowed: true,
            data: {
              justification: 'Test permission',
              allowance: '0x1000',
            },
          },
          rules: [
            {
              type: 'expiry',
              isAdjustmentAllowed: true,
              data: {
                timestamp: 123456,
              },
            },
          ],
          address: '0x1234567890123456789012345678901234567890',
          context: '0x1',
          dependencyInfo: [
            {
              factory: '0x1234567890123456789012345678901234567890',
              factoryData: '0x',
            },
          ],
          signerMeta: {
            delegationManager: '0x1234567890123456789012345678901234567890',
          },
        },
      ];
      setupSuccessfulPermissionFlow();
      mockSnapsProvider.request.mockResolvedValueOnce(
        mockGrantedPermissions as unknown as Json,
      );

      const result = await handler.requestExecutionPermissions({
        siteOrigin,
        params: mockPermissions as unknown as Json,
      });

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          // eslint-disable-next-line no-restricted-globals
          snapId: process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
          request: {
            method: ExternalMethod.PermissionsProviderGrantPermissions,
            params: {
              permissionsRequest: mockPermissions,
              siteOrigin,
            },
          },
        },
      });
      expect(result).toStrictEqual(mockGrantedPermissions);
    });

    it('should handle errors thrown during call to permissions provider when granting permissions', async () => {
      setupSuccessfulPermissionFlow();
      mockSnapsProvider.request.mockRejectedValueOnce(new Error('Test error'));

      await expect(
        handler.requestExecutionPermissions({
          siteOrigin,
          params: mockPermissions as unknown as Json,
        }),
      ).rejects.toThrow('Test error');
    });

    it('should handle user rejection with error code 4001', async () => {
      setupSuccessfulPermissionFlow();
      const userRejectionError = {
        code: 4001,
        message: 'Permission request denied',
      };
      mockSnapsProvider.request.mockRejectedValueOnce(userRejectionError);

      await expect(
        handler.requestExecutionPermissions({
          siteOrigin,
          params: mockPermissions as unknown as Json,
        }),
      ).rejects.toThrow('Permission request denied');
    });
  });

  describe('getSupportedExecutionPermissions', () => {
    it('should successfully return supported permissions from gator snap', async () => {
      const mockSupportedPermissions: GetSupportedPermissionsResult = {
        'native-token-stream': {
          chainIds: ['0x1', '0xa'],
          ruleTypes: ['expiry'],
        },
        'erc20-token-stream': {
          chainIds: ['0x1', '0xa'],
          ruleTypes: ['expiry'],
        },
      };

      mockSnapsProvider.request.mockResolvedValueOnce(
        mockSupportedPermissions as unknown as Json,
      );

      const result = await handler.getSupportedExecutionPermissions();

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          // eslint-disable-next-line no-restricted-globals
          snapId: process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
          request: {
            method: ExternalMethod.PermissionsProviderGetSupportedPermissions,
          },
        },
      });
      expect(result).toStrictEqual(mockSupportedPermissions);
    });

    it('should handle errors thrown during call to permissions provider', async () => {
      mockSnapsProvider.request.mockRejectedValueOnce(new Error('Test error'));

      await expect(handler.getSupportedExecutionPermissions()).rejects.toThrow(
        'Test error',
      );
    });
  });

  describe('getGrantedExecutionPermissions', () => {
    const siteOrigin = 'https://example.com';

    it('should successfully return granted permissions for site origin', async () => {
      const mockStoredPermissions = [
        {
          permissionResponse: {
            chainId: '0x1',
            address: '0x1234567890123456789012345678901234567890',
            permission: {
              type: 'native-token-stream',
              data: { justification: 'Test' },
            },
          },
          siteOrigin: 'https://example.com',
          isRevoked: false,
        },
        {
          permissionResponse: {
            chainId: '0x1',
            address: '0x1234567890123456789012345678901234567890',
            permission: {
              type: 'erc20-token-stream',
              data: { justification: 'Test 2' },
            },
          },
          siteOrigin: 'https://example.com',
          isRevoked: false,
        },
      ];

      mockSnapsProvider.request.mockResolvedValueOnce(
        mockStoredPermissions as unknown as Json,
      );

      const result = await handler.getGrantedExecutionPermissions({
        siteOrigin,
      });

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          // eslint-disable-next-line no-restricted-globals
          snapId: process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
          request: {
            method: ExternalMethod.PermissionsProviderGetGrantedPermissions,
            params: {
              siteOrigin,
              isRevoked: false,
            },
          },
        },
      });

      // Should extract only permissionResponse from each stored permission
      expect(result).toStrictEqual([
        mockStoredPermissions[0]?.permissionResponse,
        mockStoredPermissions[1]?.permissionResponse,
      ]);
    });

    it('should return empty array when no permissions are granted', async () => {
      mockSnapsProvider.request.mockResolvedValueOnce([] as unknown as Json);

      const result = await handler.getGrantedExecutionPermissions({
        siteOrigin,
      });

      expect(result).toStrictEqual([]);
    });

    it('should handle errors thrown during call to permissions provider', async () => {
      mockSnapsProvider.request.mockRejectedValueOnce(new Error('Test error'));

      await expect(
        handler.getGrantedExecutionPermissions({ siteOrigin }),
      ).rejects.toThrow('Test error');
    });
  });
});
