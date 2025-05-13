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
  const mockPassAuth = () => {
    jwtBearerAuthMock.getAccessToken.mockResolvedValueOnce('aaa.bbb.ccc');
    jwtBearerAuthMock.getUserProfile.mockResolvedValueOnce({
      identifierId: '0x00_some_permission_context',
      profileId: '0x456',
      metaMetricsId: '0x789',
    });
  };
  const mockFailAuth = () => {
    jwtBearerAuthMock.getAccessToken.mockRejectedValue(
      new Error('Failed to fetch access token'),
    );
  };

  describe('Profile Sync feature enabled', () => {
    beforeEach(() => {
      profileSyncManager = createProfileSyncManager({
        snapEnv: 'local',
        auth: jwtBearerAuthMock,
        userStorage: userStorageMock,
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
        mockPassAuth();

        const res = await profileSyncManager.getAllGrantedPermissions();
        expect(res).toStrictEqual(mockStoredGrantedPermissions);
        expect(userStorageMock.getAllFeatureItems).toHaveBeenCalledWith(
          'gator_7715_permissions',
        );
      });

      it('should return empty array when no items exist', async () => {
        userStorageMock.getAllFeatureItems.mockResolvedValueOnce(null);
        mockPassAuth();

        const permissions = await profileSyncManager.getAllGrantedPermissions();
        expect(permissions).toStrictEqual([]);
      });

      it('should return empty array when storage throws error', async () => {
        userStorageMock.getAllFeatureItems.mockRejectedValueOnce(
          new Error('Storage error'),
        );
        mockPassAuth();

        await expect(
          profileSyncManager.getAllGrantedPermissions(),
        ).rejects.toThrow('Storage error');
      });

      it('should return null if it fails to fetch access token(ie, user fails auth)', async () => {
        mockFailAuth();

        await expect(
          profileSyncManager.getAllGrantedPermissions(),
        ).rejects.toThrow('Failed to fetch access token');
      });
    });

    describe('getGrantedPermission', () => {
      it('should return granted permission when it exists in profile sync', async () => {
        userStorageMock.getItem.mockResolvedValueOnce(
          JSON.stringify(mockStoredGrantedPermission),
        );
        mockPassAuth();

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
        mockPassAuth();

        const permission = await profileSyncManager.getGrantedPermission(
          '0x00_some_permission_context' as Hex,
        );
        expect(permission).toBeNull();
      });

      it('should throw error when profile sync storage throws error', async () => {
        userStorageMock.getItem.mockRejectedValueOnce(
          new Error('Storage error'),
        );
        mockPassAuth();

        await expect(
          profileSyncManager.getGrantedPermission(
            '0x00_some_permission_context' as Hex,
          ),
        ).rejects.toThrow('Storage error');
      });
    });

    describe('storeGrantedPermission', () => {
      it('should store granted permission successfully in profile sync', async () => {
        await profileSyncManager.storeGrantedPermission(
          mockStoredGrantedPermission,
        );
        mockPassAuth();

        expect(userStorageMock.setItem).toHaveBeenCalledWith(
          'gator_7715_permissions.0x00_some_permission_context',
          JSON.stringify(mockStoredGrantedPermission),
        );
      });

      it('should throw error when profile sync storage throws error', async () => {
        userStorageMock.setItem.mockRejectedValueOnce(
          new Error('Storage error'),
        );
        mockPassAuth();

        await expect(
          profileSyncManager.storeGrantedPermission(
            mockStoredGrantedPermission,
          ),
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
        mockPassAuth();

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

      it('should throw error when profile sync storage throws error', async () => {
        const mockStoredGrantedPermissions = [mockStoredGrantedPermission];
        userStorageMock.batchSetItems.mockRejectedValueOnce(
          new Error('Storage error'),
        );

        mockPassAuth();

        const promise = profileSyncManager.storeGrantedPermissionBatch(
          mockStoredGrantedPermissions,
        );
        await expect(promise).rejects.toThrow('Storage error');
      });
    });
  });

  describe('Profile Sync feature disabled', () => {
    beforeEach(() => {
      profileSyncManager = createProfileSyncManager({
        snapEnv: 'production',
        auth: jwtBearerAuthMock,
        userStorage: userStorageMock,
      });
    });

    describe('getAllGrantedPermissions', () => {
      it('should throw error when profile sync feature is disabled', async () => {
        await expect(
          profileSyncManager.getAllGrantedPermissions(),
        ).rejects.toThrow('Feature is not enabled');
      });
    });

    describe('getGrantedPermission', () => {
      it('should throw error when profile sync feature is disabled', async () => {
        await expect(
          profileSyncManager.getGrantedPermission(
            '0x00_some_permission_context' as Hex,
          ),
        ).rejects.toThrow('Feature is not enabled');
      });
    });

    describe('storeGrantedPermission', () => {
      it('should throw error when profile sync feature is disabled', async () => {
        await expect(
          profileSyncManager.storeGrantedPermission(
            mockStoredGrantedPermission,
          ),
        ).rejects.toThrow('Feature is not enabled');
      });
    });

    describe('storeGrantedPermissionBatch', () => {
      it('should throw error when profile sync feature is disabled', async () => {
        await expect(
          profileSyncManager.storeGrantedPermissionBatch([
            mockStoredGrantedPermission,
          ]),
        ).rejects.toThrow('Feature is not enabled');
      });
    });
  });
});
