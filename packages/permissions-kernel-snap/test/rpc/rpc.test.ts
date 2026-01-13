import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type {
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
        to: '0x1234567890123456789012345678901234567890',
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
          to: '0x1234567890123456789012345678901234567890',
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
          to: '0x1234567890123456789012345678901234567890',
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
              data: {
                timestamp: 123456,
              },
            },
          ],
          from: '0x1234567890123456789012345678901234567890',
          context: '0x1',
          dependencies: [
            {
              factory: '0x1234567890123456789012345678901234567890',
              factoryData: '0x',
            },
          ],
          delegationManager: '0x1234567890123456789012345678901234567890',
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
});
