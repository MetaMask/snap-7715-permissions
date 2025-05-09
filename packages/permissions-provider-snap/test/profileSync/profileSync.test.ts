import type {
  JwtBearerAuth,
  UserStorage,
} from '@metamask/profile-sync-controller/sdk';
import type { Hex } from 'viem';
import { getAddress } from 'viem';

import {
  createProfileSyncManager,
  type ProfileSyncManager,
  type StoredGrantedPermission,
} from '../../src/profileSync';

describe('profileSync', () => {
  const address = getAddress('0x1234567890123456789012345678901234567890');
  const sessionAccount = getAddress(
    '0x1234567890123456789012345678901234567890',
  );
  let profileSyncManager: ProfileSyncManager;
  const jwtBearerAuthMock = {
    getAccessToken: jest.fn(),
    getUserProfile: jest.fn(),
  } as unknown as jest.Mocked<JwtBearerAuth>;
  const userStorageMock = {
    getAllFeatureItems: jest.fn(),
    getItem: jest.fn(),
    setItem: jest.fn(),
    batchSetItems: jest.fn(),
  } as unknown as jest.Mocked<UserStorage>;

  const mockStoredGrantedPermission: StoredGrantedPermission = {
    permissionResponse: {
      address,
      accountMeta: [
        {
          factory: '0x1234567890123456789012345678901234567890',
          factoryData: '0x000000000000000000000000000000_factory_data',
        },
      ],
      chainId: '0xaa36a7',
      context: '0x00_some_permission_context',
      expiry: 1,
      isAdjustmentAllowed: true,
      permission: {
        data: {
          justification: 'shh...permission',
          amountPerSecond: '0x180f8a7451f',
          initialAmount: '0xde0b6b3a7640000',
          startTime: 1000,
          maxAmount:
            '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        },
        type: 'native-token-stream',
      },

      signer: {
        data: { address: sessionAccount },
        type: 'account',
      },
      signerMeta: { delegationManager: '0x000000_delegation_manager' },
    },
    siteOrigin: 'https://example.com',
  };

  beforeEach(() => {
    profileSyncManager = createProfileSyncManager({
      auth: jwtBearerAuthMock,
      userStorage: userStorageMock,
    });
  });

  describe('getUserProfile', () => {
    it('should return the user profile if the user pass auth', async () => {
      jwtBearerAuthMock.getAccessToken.mockResolvedValueOnce('aaa.bbb.ccc');
      jwtBearerAuthMock.getUserProfile.mockResolvedValueOnce({
        identifierId: '0x00_some_permission_context',
        profileId: '0x456',
        metaMetricsId: '0x789',
      });
      const userProfile = await profileSyncManager.getUserProfile();

      expect(userProfile).toBeDefined();
    });

    it('should return null if it fails to fetch access token(ie, user fails auth)', async () => {
      jwtBearerAuthMock.getAccessToken.mockRejectedValue(
        new Error('Failed to fetch access token'),
      );

      const userProfile = await profileSyncManager.getUserProfile();
      expect(userProfile).toBeNull();
    });
  });

  describe('getAllGrantedPermissions', () => {
    it('should return all granted permissions when items exist', async () => {
      const mockStoredGrantedPermissions = [mockStoredGrantedPermission];
      userStorageMock.getAllFeatureItems.mockResolvedValueOnce(
        mockStoredGrantedPermissions.map((permission) =>
          JSON.stringify(permission),
        ),
      );

      const res = await profileSyncManager.getAllGrantedPermissions();
      expect(res).toStrictEqual(mockStoredGrantedPermissions);
      expect(userStorageMock.getAllFeatureItems).toHaveBeenCalledWith(
        'gator_7715_permissions',
      );
    });

    it('should return empty array when no items exist', async () => {
      userStorageMock.getAllFeatureItems.mockResolvedValueOnce(null);

      const permissions = await profileSyncManager.getAllGrantedPermissions();
      expect(permissions).toStrictEqual([]);
    });

    it('should return empty array when storage throws error', async () => {
      userStorageMock.getAllFeatureItems.mockRejectedValueOnce(
        new Error('Storage error'),
      );

      const permissions = await profileSyncManager.getAllGrantedPermissions();
      expect(permissions).toStrictEqual([]);
    });
  });

  describe('getGrantedPermission', () => {
    it('should return granted permission when it exists in profile sync', async () => {
      userStorageMock.getItem.mockResolvedValueOnce(
        JSON.stringify(mockStoredGrantedPermission),
      );

      const res = await profileSyncManager.getGrantedPermission(
        '0x00_some_permission_context' as Hex,
      );
      expect(res).toStrictEqual(mockStoredGrantedPermission);
      expect(userStorageMock.getItem).toHaveBeenCalledWith(
        'gator_7715_permissions.0x00_some_permission_context',
      );
    });

    it('should return null when granted permission does not exist in profile sync', async () => {
      userStorageMock.getItem.mockResolvedValueOnce(null);

      const permission = await profileSyncManager.getGrantedPermission(
        '0x00_some_permission_context' as Hex,
      );
      expect(permission).toBeNull();
    });

    it('should return null when profile sync storage throws error', async () => {
      userStorageMock.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const permission = await profileSyncManager.getGrantedPermission(
        '0x00_some_permission_context' as Hex,
      );
      expect(permission).toBeNull();
    });
  });

  describe('storeGrantedPermission', () => {
    it('should store granted permission successfully in profile sync', async () => {
      await profileSyncManager.storeGrantedPermission(
        mockStoredGrantedPermission,
      );
      expect(userStorageMock.setItem).toHaveBeenCalledWith(
        'gator_7715_permissions.0x00_some_permission_context',
        JSON.stringify(mockStoredGrantedPermission),
      );
    });

    it('should handle profile sync storage errors gracefully', async () => {
      userStorageMock.setItem.mockRejectedValueOnce(new Error('Storage error'));

      await expect(
        profileSyncManager.storeGrantedPermission(mockStoredGrantedPermission),
      ).rejects.toThrow('Storage error');
    });
  });

  describe('storeGrantedPermissionBatch', () => {
    it('should store multiple granted permissions successfully in profile sync', async () => {
      const mockStoredGrantedPermissions = [
        mockStoredGrantedPermission,
        {
          permissionResponse: {
            ...mockStoredGrantedPermission.permissionResponse,
            context: '0x00_some_permission_context2' as Hex,
          },
          siteOrigin: 'https://example2.com',
        },
      ];

      await profileSyncManager.storeGrantedPermissionBatch(
        mockStoredGrantedPermissions,
      );
      expect(userStorageMock.batchSetItems).toHaveBeenCalledWith(
        'gator_7715_permissions',
        [
          [
            '0x00_some_permission_context',
            JSON.stringify(mockStoredGrantedPermissions[0]),
          ],
          [
            '0x00_some_permission_context2',
            JSON.stringify(mockStoredGrantedPermissions[1]),
          ],
        ],
      );
    });

    it('should handle profile sync storage errors gracefully', async () => {
      const mockStoredGrantedPermissions = [mockStoredGrantedPermission];
      userStorageMock.batchSetItems.mockRejectedValueOnce(
        new Error('Storage error'),
      );

      const promise = profileSyncManager.storeGrantedPermissionBatch(
        mockStoredGrantedPermissions,
      );
      await expect(promise).rejects.toThrow('Storage error');
    });
  });
});
