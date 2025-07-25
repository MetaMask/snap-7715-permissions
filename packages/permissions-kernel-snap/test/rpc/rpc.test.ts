import { GATOR_PERMISSIONS_PROVIDER_SNAP_ID } from '@metamask/7715-permissions-shared/constants';
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
        expiry: Date.now() + 3600000,
        signer: {
          type: 'account',
          data: {
            address: '0x1234567890123456789012345678901234567890',
          },
        },
        permission: {
          type: 'native-token-transfer',
          data: {
            justification: 'Test permission',
            allowance: '0x1000',
          },
        },
      },
    ];

    it('should throw error when permission provider does not support all requested permissions', async () => {
      const mockPartialPermissions: PermissionsRequest = [
        {
          chainId: '0x1',
          expiry: Date.now() + 3600000,
          signer: {
            type: 'account',
            data: {
              address: '0x1234567890123456789012345678901234567890',
            },
          },
          permission: {
            type: 'native-token-transfer',
            data: {
              justification: 'Test permission',
              allowance: '0x1000',
            },
          },
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
            'The following permissions can not be granted by the permission provider: native-token-stream',
        },
      );

      await expect(
        handler.grantPermissions({
          siteOrigin,
          params: mockPartialPermissions as unknown as Json,
        }),
      ).rejects.toThrow(
        'The following permissions can not be granted by the permission provider: native-token-stream',
      );
    });

    it('should successfully grant permissions', async () => {
      const mockGrantedPermissions: PermissionsResponse = [
        {
          chainId: '0x1',
          expiry: Date.now() + 3600000,
          signer: {
            type: 'account',
            data: {
              address: '0x1234567890123456789012345678901234567890',
            },
          },
          permission: {
            type: 'native-token-transfer',
            data: {
              justification: 'Test permission',
              allowance: '0x1000',
            },
          },
          address: '0x1234567890123456789012345678901234567890',
          isAdjustmentAllowed: true,
          context: '0x1',
          accountMeta: [],
          signerMeta: {
            delegationManager: '0x1234567890123456789012345678901234567890',
          },
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
      mockPermissionOfferRegistryManager.findRelevantPermissionsToGrant.mockReturnValue(
        {
          permissionsToGrant: mockPermissions,
          missingPermissions: [],
        },
      );
      mockSnapsProvider.request.mockResolvedValueOnce(
        mockGrantedPermissions as unknown as Json,
      );

      const result = await handler.grantPermissions({
        siteOrigin,
        params: mockPermissions as unknown as Json,
      });

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
          request: {
            method: ExternalMethod.PermissionProviderGrantPermissions,
            params: {
              permissionsRequest: mockPermissions,
              siteOrigin,
            },
          },
        },
      });
      expect(result).toStrictEqual(mockGrantedPermissions);
    });

    it('should handle errors thrown during call to permission provider when granting permissions', async () => {
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
      mockSnapsProvider.request.mockRejectedValueOnce(new Error('Test error'));

      await expect(
        handler.grantPermissions({
          siteOrigin,
          params: mockPermissions as unknown as Json,
        }),
      ).rejects.toThrow('Test error');
    });
  });
});
