import { GATOR_PERMISSIONS_PROVIDER_SNAP_ID } from '@metamask/7715-permissions-shared/constants';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type {
  PermissionsRequest,
  PermissionsResponse,
} from '@metamask/7715-permissions-shared/types';
import type { Json } from '@metamask/snaps-sdk';

import type { Registry } from '../../src/registry';
import { createRpcHandler, type RpcHandler } from '../../src/rpc/rpcHandler';
import { ExternalMethod } from '../../src/rpc/rpcMethod';
import type { StateManager } from '../../src/stateManagement';

describe('RpcHandler', () => {
  let handler: RpcHandler;
  const mockSnapsProvider = createMockSnapsProvider();
  const mockStateManager = {
    getState: jest.fn(),
    setState: jest.fn(),
  } as unknown as jest.Mocked<StateManager>;
  const mockRegistry = {
    buildPermissionProviderRegistry: jest.fn(),
    findRelevantPermissions: jest.fn(),
    reducePermissionOfferRegistry: jest.fn(),
  } as unknown as jest.Mocked<Registry>;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = createRpcHandler({
      snapsProvider: mockSnapsProvider,
      stateManager: mockStateManager,
      registry: mockRegistry,
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

    it('should handle empty registry case', async () => {
      mockRegistry.buildPermissionProviderRegistry.mockResolvedValue({});
      mockSnapsProvider.request.mockResolvedValueOnce([]);

      const result = await handler.grantPermissions(
        siteOrigin,
        mockPermissions as unknown as Json,
      );

      expect(mockRegistry.buildPermissionProviderRegistry).toHaveBeenCalled();
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_dialog',
        params: expect.any(Object),
      });
      expect(result).toStrictEqual([]);
    });

    it('should handle no relevant permissions case', async () => {
      mockRegistry.buildPermissionProviderRegistry.mockResolvedValue({
        'test-provider': [],
      });
      mockRegistry.reducePermissionOfferRegistry.mockReturnValue([]);
      mockRegistry.findRelevantPermissions.mockReturnValue([]);
      mockSnapsProvider.request.mockResolvedValueOnce([]);

      const result = await handler.grantPermissions(
        siteOrigin,
        mockPermissions as unknown as Json,
      );

      expect(mockRegistry.findRelevantPermissions).toHaveBeenCalled();
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_dialog',
        params: expect.any(Object),
      });
      expect(result).toStrictEqual([]);
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
      mockRegistry.buildPermissionProviderRegistry.mockResolvedValue({
        'test-provider': [],
      });
      mockRegistry.reducePermissionOfferRegistry.mockReturnValue([]);
      mockRegistry.findRelevantPermissions.mockReturnValue(mockPermissions);
      mockSnapsProvider.request.mockResolvedValueOnce(
        mockGrantedPermissions as unknown as Json,
      );

      const result = await handler.grantPermissions(
        siteOrigin,
        mockPermissions as unknown as Json,
      );

      expect(mockStateManager.setState).toHaveBeenCalledWith({
        permissionOfferRegistry: expect.any(Object),
      });
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
          request: {
            method: ExternalMethod.PermissionProviderGrantAttenuatedPermissions,
            params: {
              permissionsRequest: mockPermissions,
              siteOrigin,
            },
          },
        },
      });
      expect(result).toStrictEqual(mockGrantedPermissions);
    });

    it('should handle errors during permission grant', async () => {
      mockRegistry.buildPermissionProviderRegistry.mockResolvedValue({
        'test-provider': [],
      });
      mockRegistry.reducePermissionOfferRegistry.mockReturnValue([]);
      mockRegistry.findRelevantPermissions.mockReturnValue(mockPermissions);
      mockSnapsProvider.request.mockRejectedValueOnce(new Error('Test error'));

      await expect(
        handler.grantPermissions(
          siteOrigin,
          mockPermissions as unknown as Json,
        ),
      ).rejects.toThrow('Test error');
    });
  });
});
