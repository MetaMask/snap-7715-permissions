import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { PermissionsRequest } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';

import { createPermissionOfferRegistryManager } from '../src/registryManager';
import type { PermissionOfferRegistryManager } from '../src/registryManager';
import { ExternalMethod } from '../src/rpc/rpcMethod';

describe('PermissionOfferRegistryManager', () => {
  let permissionOfferRegistryManager: PermissionOfferRegistryManager;
  const mockSnapsProvider = createMockSnapsProvider();
  const mockSnapId =
    // eslint-disable-next-line no-restricted-globals
    process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID ??
    'local:http://localhost:8082';

  beforeEach(() => {
    mockSnapsProvider.request.mockReset();
    permissionOfferRegistryManager =
      createPermissionOfferRegistryManager(mockSnapsProvider);
  });

  describe('buildPermissionOffersRegistry', () => {
    it('should build registry with valid permission offers', async () => {
      const mockOffers = [
        {
          type: 'native-token-transfer',
          proposedName: 'Transfer native tokens',
        },
      ];

      mockSnapsProvider.request.mockResolvedValueOnce(mockOffers);

      const result =
        await permissionOfferRegistryManager.buildPermissionOffersRegistry(
          mockSnapId,
        );

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: mockSnapId,
          request: {
            method: ExternalMethod.PermissionsProviderGetPermissionOffers,
          },
        },
      });

      expect(result).toStrictEqual({
        [mockSnapId]: [
          expect.objectContaining({
            hostId: mockSnapId,
            type: 'native-token-transfer',
            proposedName: 'Transfer native tokens',
          }),
        ],
      });
    });

    it('should handle empty permission offers and return empty registry', async () => {
      mockSnapsProvider.request.mockResolvedValueOnce([]);

      const result =
        await permissionOfferRegistryManager.buildPermissionOffersRegistry(
          mockSnapId,
        );
      expect(result).toStrictEqual({});
    });

    it('should handle invalid permission offers and return empty registry', async () => {
      mockSnapsProvider.request.mockResolvedValueOnce({ invalid: 'data' });

      const result =
        await permissionOfferRegistryManager.buildPermissionOffersRegistry(
          mockSnapId,
        );
      expect(result).toStrictEqual({});
    });

    it('should handle snap request error and return empty registry', async () => {
      jest.spyOn(logger, 'error');
      mockSnapsProvider.request.mockRejectedValueOnce(new Error('Snap error'));

      const result =
        await permissionOfferRegistryManager.buildPermissionOffersRegistry(
          mockSnapId,
        );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('does not support'),
      );
      expect(result).toStrictEqual({});
    });
  });

  describe('getRegisteredPermissionOffers', () => {
    it('should flatten registry to array of offers', () => {
      const mockRegistry = {
        [mockSnapId]: [
          {
            hostId: mockSnapId,
            type: 'native-token-transfer',
            proposedName: 'Transfer native tokens',
          },
        ],
        snap2: [
          {
            hostId: 'snap2',
            type: 'erc20-token-transfer',
            proposedName: 'Transfer ERC20 tokens',
          },
        ],
      };

      const result =
        permissionOfferRegistryManager.getRegisteredPermissionOffers(
          mockRegistry,
        );

      expect(result).toStrictEqual([
        {
          hostId: mockSnapId,
          type: 'native-token-transfer',
          proposedName: 'Transfer native tokens',
        },
        {
          hostId: 'snap2',
          type: 'erc20-token-transfer',
          proposedName: 'Transfer ERC20 tokens',
        },
      ]);
    });

    it('should handle empty registry', () => {
      const result =
        permissionOfferRegistryManager.getRegisteredPermissionOffers({});

      expect(result).toStrictEqual([]);
    });
  });

  describe('findRelevantPermissionsToGrant', () => {
    const mockRegisteredOffers = [
      {
        hostId: mockSnapId,
        type: 'native-token-transfer',
        proposedName: 'Transfer native tokens',
      },
      {
        hostId: mockSnapId,
        type: 'native-token-stream',
        proposedName: 'Transfer ERC20 tokens',
      },
    ];

    const mockPermissionsToGrant: PermissionsRequest = [
      {
        chainId: '0x1' as `0x${string}`,
        to: '0x1234567890123456789012345678901234567890',
        permission: {
          type: 'native-token-transfer',
          isAdjustmentAllowed: true,
          data: {},
        },
        rules: [
          {
            type: 'expiry',
            data: {
              timestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
            },
          },
        ],
      },
      {
        chainId: '0x1' as `0x${string}`,
        to: '0x1234567890123456789012345678901234567890',
        permission: {
          type: 'native-token-stream',
          isAdjustmentAllowed: true,
          data: {},
        },
        rules: [
          {
            type: 'expiry',
            data: {
              timestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
            },
          },
        ],
      },
    ];

    it('should find relevant permissions to grant filtered against registered offers', () => {
      const result =
        permissionOfferRegistryManager.findRelevantPermissionsToGrant({
          allRegisteredOffers: mockRegisteredOffers,
          permissionsToGrant: mockPermissionsToGrant,
        });

      expect(result.permissionsToGrant).toStrictEqual(mockPermissionsToGrant);
      expect(result.missingPermissions).toStrictEqual([]);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should return empty arrays and error message when no matches found', () => {
      const result =
        permissionOfferRegistryManager.findRelevantPermissionsToGrant({
          allRegisteredOffers: [],
          permissionsToGrant: mockPermissionsToGrant,
        });

      expect(result.permissionsToGrant).toStrictEqual([]);
      expect(result.missingPermissions).toStrictEqual(mockPermissionsToGrant);
      expect(result.errorMessage).toBe(
        'The following permissions can not be granted by the permissions provider: native-token-transfer, native-token-stream',
      );
    });

    it('should handle empty permissions to grant', () => {
      const result =
        permissionOfferRegistryManager.findRelevantPermissionsToGrant({
          allRegisteredOffers: mockRegisteredOffers,
          permissionsToGrant: [],
        });

      expect(result.permissionsToGrant).toStrictEqual([]);
      expect(result.missingPermissions).toStrictEqual([]);
      expect(result.errorMessage).toBeUndefined();
    });
  });
});
