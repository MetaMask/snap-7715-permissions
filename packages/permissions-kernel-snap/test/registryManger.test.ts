import { GATOR_PERMISSIONS_PROVIDER_SNAP_ID } from '@metamask/7715-permissions-shared/constants';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { PermissionsRequest } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';

import {
  createPermissionOfferRegistryManger,
  type PermissionOfferRegistryManger,
} from '../src/registryManger';
import { ExternalMethod } from '../src/rpc/rpcMethod';

describe('PermissionOfferRegistryManger', () => {
  let permissionOfferRegistryManger: PermissionOfferRegistryManger;
  const mockSnapsProvider = createMockSnapsProvider();
  const mockSnapId = GATOR_PERMISSIONS_PROVIDER_SNAP_ID;

  beforeEach(() => {
    mockSnapsProvider.request.mockReset();
    permissionOfferRegistryManger =
      createPermissionOfferRegistryManger(mockSnapsProvider);
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
        await permissionOfferRegistryManger.buildPermissionOffersRegistry(
          mockSnapId,
        );

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: mockSnapId,
          request: {
            method: ExternalMethod.PermissionProviderGetPermissionOffers,
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
        await permissionOfferRegistryManger.buildPermissionOffersRegistry(
          mockSnapId,
        );
      expect(result).toStrictEqual({});
    });

    it('should handle invalid permission offers and return empty registry', async () => {
      mockSnapsProvider.request.mockResolvedValueOnce({ invalid: 'data' });

      const result =
        await permissionOfferRegistryManger.buildPermissionOffersRegistry(
          mockSnapId,
        );
      expect(result).toStrictEqual({});
    });

    it('should handle snap request error and return empty registry', async () => {
      jest.spyOn(logger, 'debug');
      mockSnapsProvider.request.mockRejectedValueOnce(new Error('Snap error'));

      const result =
        await permissionOfferRegistryManger.buildPermissionOffersRegistry(
          mockSnapId,
        );
      expect(logger.debug).toHaveBeenCalledWith(
        {
          snapId: mockSnapId,
          error: expect.any(Error),
        },
        expect.stringContaining('does not support'),
      );
      expect(result).toStrictEqual({});
    });
  });

  describe('findRelevantPermissionsToGrant', () => {
    const mockRegisteredOffers = [
      {
        hostId: mockSnapId,
        type: 'native-token-transfer',
        hostPermissionId: '1',
        proposedName: 'Transfer native tokens',
      },
      {
        hostId: mockSnapId,
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
          type: 'native-token-stream',
          data: {},
        },
      },
    ];

    it('should find relevant permissions to grant filtered against registered offers', () => {
      const result =
        permissionOfferRegistryManger.findRelevantPermissionsToGrant(
          mockRegisteredOffers,
          mockPermissionsToGrant,
        );

      const { length } = result;
      expect(length).toBe(1);
      expect(result[0]).toStrictEqual(mockPermissionsToGrant[0]);
    });

    it('should return empty array when no matches found', () => {
      const result =
        permissionOfferRegistryManger.findRelevantPermissionsToGrant(
          [],
          mockPermissionsToGrant,
        );

      expect(result).toStrictEqual([]);
    });

    it('should handle empty permissions to grant', () => {
      const result =
        permissionOfferRegistryManger.findRelevantPermissionsToGrant(
          mockRegisteredOffers,
          [],
        );

      expect(result).toStrictEqual([]);
    });
  });

  describe('getRegisteredPermissionOffers', () => {
    it('should reduce registry to array of offers', () => {
      const mockRegistry = {
        [mockSnapId]: [
          {
            hostId: mockSnapId,
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

      const result =
        permissionOfferRegistryManger.getRegisteredPermissionOffers(
          mockRegistry,
        );

      expect(result).toStrictEqual([
        {
          hostId: mockSnapId,
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
      const result =
        permissionOfferRegistryManger.getRegisteredPermissionOffers({});

      expect(result).toStrictEqual([]);
    });
  });
});
