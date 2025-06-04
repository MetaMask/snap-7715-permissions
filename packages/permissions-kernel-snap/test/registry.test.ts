import { GATOR_PERMISSIONS_PROVIDER_SNAP_ID } from '@metamask/7715-permissions-shared/constants';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { PermissionsRequest } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';

import { createRegistry, type Registry } from '../src/registry';
import { ExternalMethod } from '../src/rpc/rpcMethod';

describe('Registry', () => {
  let registry: Registry;
  const mockSnapsProvider = createMockSnapsProvider();

  beforeEach(() => {
    mockSnapsProvider.request.mockReset();
    registry = createRegistry(mockSnapsProvider);
  });

  describe('buildPermissionProviderRegistry', () => {
    it('should build registry with valid permission offers', async () => {
      const mockOffers = [
        {
          type: 'native-token-transfer',
          id: '1',
          proposedName: 'Transfer native tokens',
        },
      ];

      mockSnapsProvider.request.mockResolvedValueOnce(mockOffers);

      const result = await registry.buildPermissionProviderRegistry();

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
          request: {
            method: ExternalMethod.PermissionProviderGetPermissionOffers,
          },
        },
      });

      expect(result).toStrictEqual({
        [GATOR_PERMISSIONS_PROVIDER_SNAP_ID]: [
          {
            hostId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
            type: 'native-token-transfer',
            hostPermissionId: '1',
            proposedName: 'Transfer native tokens',
          },
        ],
      });
    });

    it('should handle empty permission offers and return empty registry', async () => {
      mockSnapsProvider.request.mockResolvedValueOnce([]);

      const result = await registry.buildPermissionProviderRegistry();
      expect(result).toStrictEqual({});
    });

    it('should handle invalid permission offers and return empty registry', async () => {
      mockSnapsProvider.request.mockResolvedValueOnce({ invalid: 'data' });

      const result = await registry.buildPermissionProviderRegistry();
      expect(result).toStrictEqual({});
    });

    it('should handle snap request error and return empty registry', async () => {
      jest.spyOn(logger, 'debug');
      mockSnapsProvider.request.mockRejectedValueOnce(new Error('Snap error'));

      const result = await registry.buildPermissionProviderRegistry();
      expect(logger.debug).toHaveBeenCalledWith(
        {
          snapId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
          error: expect.any(Error),
        },
        expect.stringContaining('does not support'),
      );
      expect(result).toStrictEqual({});
    });
  });

  describe('findRelevantPermissions', () => {
    const mockRegisteredOffers = [
      {
        hostId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
        type: 'native-token-transfer',
        hostPermissionId: '1',
        proposedName: 'Transfer native tokens',
      },
      {
        hostId: 'snap2',
        type: 'erc20-token-transfer',
        hostPermissionId: '2',
        proposedName: 'Transfer ERC20 tokens',
      },
    ];

    const mockPermissionsToGrant: PermissionsRequest = [
      {
        chainId: '0x1' as `0x${string}`,
        expiry: 1234567890,
        signer: {
          type: 'account' as const,
          data: {
            address:
              '0x1234567890123456789012345678901234567890' as `0x${string}`,
          },
        },
        permission: {
          type: 'native-token-transfer',
          data: {},
        },
      },
      {
        chainId: '0x1' as `0x${string}`,
        expiry: 1234567890,
        signer: {
          type: 'account' as const,
          data: {
            address:
              '0x1234567890123456789012345678901234567890' as `0x${string}`,
          },
        },
        permission: {
          type: 'erc20-token-transfer',
          data: {},
        },
      },
    ];

    it('should find matching permissions', () => {
      const result = registry.findRelevantPermissions(
        mockRegisteredOffers,
        mockPermissionsToGrant,
      );

      const { length } = result;
      expect(length).toBe(1);
      expect(result[0]).toStrictEqual(mockPermissionsToGrant[0]);
    });

    it('should return empty array when no matches found', () => {
      const result = registry.findRelevantPermissions(
        [],
        mockPermissionsToGrant,
      );

      expect(result).toStrictEqual([]);
    });

    it('should handle empty permissions to grant', () => {
      const result = registry.findRelevantPermissions(mockRegisteredOffers, []);

      expect(result).toStrictEqual([]);
    });
  });

  describe('reducePermissionOfferRegistry', () => {
    it('should reduce registry to array of offers', () => {
      const mockRegistry = {
        [GATOR_PERMISSIONS_PROVIDER_SNAP_ID]: [
          {
            hostId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
            type: 'native-token-transfer',
            hostPermissionId: '1',
            proposedName: 'Transfer native tokens',
          },
        ],
        snap2: [
          {
            hostId: 'snap2',
            type: 'erc20-token-transfer',
            hostPermissionId: '2',
            proposedName: 'Transfer ERC20 tokens',
          },
        ],
      };

      const result = registry.reducePermissionOfferRegistry(mockRegistry);

      expect(result).toStrictEqual([
        {
          hostId: GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
          type: 'native-token-transfer',
          hostPermissionId: '1',
          proposedName: 'Transfer native tokens',
        },
        {
          hostId: 'snap2',
          type: 'erc20-token-transfer',
          hostPermissionId: '2',
          proposedName: 'Transfer ERC20 tokens',
        },
      ]);
    });

    it('should handle empty registry', () => {
      const result = registry.reducePermissionOfferRegistry({});

      expect(result).toStrictEqual([]);
    });
  });
});
