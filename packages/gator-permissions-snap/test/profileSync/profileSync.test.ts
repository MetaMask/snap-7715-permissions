import {
  encodeDelegations,
  hashDelegation,
  ROOT_AUTHORITY,
} from '@metamask/delegation-core';
import type { Hex, Delegation } from '@metamask/delegation-core';
import type {
  JwtBearerAuth,
  UserStorage,
} from '@metamask/profile-sync-controller/sdk';

import {
  createProfileSyncManager,
  type ProfileSyncManager,
  type StoredGrantedPermission,
} from '../../src/profileSync';

describe('profileSync', () => {
  const address = '0x1234567890123456789012345678901234567890' as const;
  const addressTwo = '0x1234567890123456789012345678901234567891' as const;
  const sessionAccount = address;

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

  const mockDelegation: Delegation = {
    delegate: sessionAccount,
    delegator: address,
    caveats: [],
    signature: '0x1',
    salt: 0n,
    authority: ROOT_AUTHORITY,
  };

  const mockDelegationTwo: Delegation = {
    delegate: sessionAccount,
    delegator: addressTwo,
    caveats: [],
    salt: 0n,
    authority: ROOT_AUTHORITY,
    signature: '0x2',
  };

  const mockDelegationHash = hashDelegation(mockDelegation);
  const mockDelegationHashTwo = hashDelegation(mockDelegationTwo);

  const mockStoredGrantedPermission: StoredGrantedPermission = {
    permissionResponse: {
      chainId: '0xaa36a7',
      address,
      signer: {
        data: { address: sessionAccount },
        type: 'account',
      },
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
        isAdjustmentAllowed: true,
      },
      context: encodeDelegations([mockDelegation]),
      dependencyInfo: [
        {
          factory: '0x1234567890123456789012345678901234567890',
          factoryData:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
      ],
      signerMeta: {
        delegationManager: '0x1234567890123456789012345678901234567890',
      },
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
        isFeatureEnabled: true,
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
          mockStoredGrantedPermission.permissionResponse.context,
        );
        expect(res).toStrictEqual(mockStoredGrantedPermission);
        expect(userStorageMock.getItem).toHaveBeenCalledWith(
          `gator_7715_permissions.${mockDelegationHash}`,
        );
      });

      it('should return null when granted permission does not exist in profile sync', async () => {
        userStorageMock.getItem.mockResolvedValueOnce(null);
        mockPassAuth();

        const permission = await profileSyncManager.getGrantedPermission(
          mockStoredGrantedPermission.permissionResponse.context,
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
            mockStoredGrantedPermission.permissionResponse.context,
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
          `gator_7715_permissions.${mockDelegationHash}`,
          expect.stringMatching(
            /^\{"permissionResponse":\{.*\},"siteOrigin":"https:\/\/example\.com"\}$/u,
          ),
        );
        // Verify the stored data can be parsed and contains expected fields
        const storedData = userStorageMock.setItem.mock.calls[0]?.[1];
        expect(storedData).toBeDefined();
        const parsed = JSON.parse(storedData as string);
        expect(parsed.permissionResponse.chainId).toBe('0xaa36a7');
        expect(parsed.permissionResponse.address).toBe(
          '0x1234567890123456789012345678901234567890',
        );
        expect(parsed.siteOrigin).toBe('https://example.com');
      });

      it('should concatenate all delegation hashes together when store granted permission that has multiple delegations in profile sync', async () => {
        const mockStoredGrantedPermissionWithMultipleDelegations = {
          ...mockStoredGrantedPermission,
          permissionResponse: {
            ...mockStoredGrantedPermission.permissionResponse,
            context: encodeDelegations([mockDelegation, mockDelegationTwo]),
          },
        };
        await profileSyncManager.storeGrantedPermission(
          mockStoredGrantedPermissionWithMultipleDelegations,
        );
        mockPassAuth();

        expect(userStorageMock.setItem).toHaveBeenCalledWith(
          `gator_7715_permissions.${mockDelegationHash}${mockDelegationHashTwo.slice(2)}`,
          expect.stringMatching(
            /^\{"permissionResponse":\{.*\},"siteOrigin":"https:\/\/example\.com"\}$/u,
          ),
        );
        // Verify the stored data can be parsed and contains expected fields
        const storedData = userStorageMock.setItem.mock.calls[0]?.[1];
        expect(storedData).toBeDefined();
        const parsed = JSON.parse(storedData as string);
        expect(parsed.permissionResponse.chainId).toBe('0xaa36a7');
        expect(parsed.permissionResponse.address).toBe(
          '0x1234567890123456789012345678901234567890',
        );
        expect(parsed.siteOrigin).toBe('https://example.com');
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
        const mockStoredGrantedPermissions: StoredGrantedPermission[] = [
          mockStoredGrantedPermission,
          {
            permissionResponse: {
              chainId: '0xaa36a7',
              address: addressTwo,
              signer: {
                data: { address: sessionAccount },
                type: 'account',
              },
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
                isAdjustmentAllowed: true,
              },
              context: encodeDelegations([mockDelegationTwo]),
              dependencyInfo: [
                {
                  factory: '0x1234567890123456789012345678901234567890',
                  factoryData:
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                },
              ],
              signerMeta: {
                delegationManager: '0x1234567890123456789012345678901234567890',
              },
            },
            siteOrigin: 'https://example.com',
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
              mockDelegationHash,
              expect.stringMatching(
                /^\{"permissionResponse":\{.*\},"siteOrigin":"https:\/\/example\.com"\}$/u,
              ),
            ],
            [
              mockDelegationHashTwo,
              expect.stringMatching(
                /^\{"permissionResponse":\{.*\},"siteOrigin":"https:\/\/example\.com"\}$/u,
              ),
            ],
          ],
        );
        // Verify the stored data can be parsed and contains expected fields
        const batchCalls = userStorageMock.batchSetItems.mock.calls[0]?.[1];
        expect(batchCalls).toBeDefined();
        expect(batchCalls).toHaveLength(2);
        const firstStored = JSON.parse((batchCalls as any)[0]?.[1] as string);
        const secondStored = JSON.parse((batchCalls as any)[1]?.[1] as string);
        expect(firstStored.permissionResponse.chainId).toBe('0xaa36a7');
        expect(firstStored.permissionResponse.address).toBe(
          '0x1234567890123456789012345678901234567890',
        );
        expect(secondStored.permissionResponse.chainId).toBe('0xaa36a7');
        expect(secondStored.permissionResponse.address).toBe(
          '0x1234567890123456789012345678901234567891',
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

  describe('Validation and Error Handling', () => {
    beforeEach(() => {
      profileSyncManager = createProfileSyncManager({
        isFeatureEnabled: true,
        auth: jwtBearerAuthMock,
        userStorage: userStorageMock,
      });
    });

    it('should validate permission data structure and reject invalid data', async () => {
      const invalidData = '{"invalid": "structure"}';
      userStorageMock.getItem.mockResolvedValueOnce(invalidData);
      mockPassAuth();

      await expect(
        profileSyncManager.getGrantedPermission(
          mockStoredGrantedPermission.permissionResponse.context,
        ),
      ).rejects.toThrow('Invalid permission data structure');
    });

    it('should enforce 400kb size limit and reject oversized data', async () => {
      const largePermission = {
        ...mockStoredGrantedPermission,
        permissionResponse: {
          ...mockStoredGrantedPermission.permissionResponse,
          permission: {
            ...mockStoredGrantedPermission.permissionResponse.permission,
            data: {
              ...mockStoredGrantedPermission.permissionResponse.permission.data,
              largeData: 'x'.repeat(500 * 1024), // 500kb of data
            },
          },
        },
      };

      mockPassAuth();

      await expect(
        profileSyncManager.storeGrantedPermission(largePermission),
      ).rejects.toThrow('Permission data exceeds size limit');
    });

    it('should skip invalid items and return only valid ones in getAllGrantedPermissions', async () => {
      const validItem = JSON.stringify(mockStoredGrantedPermission);
      const invalidItem = '{"invalid": "structure"}';
      const validItem2 = JSON.stringify({
        ...mockStoredGrantedPermission,
        permissionResponse: {
          ...mockStoredGrantedPermission.permissionResponse,
          context: encodeDelegations([mockDelegationTwo]),
        },
      });

      userStorageMock.getAllFeatureItems.mockResolvedValueOnce([
        validItem,
        invalidItem,
        validItem2,
      ]);
      mockPassAuth();

      const result = await profileSyncManager.getAllGrantedPermissions();

      expect(result).toHaveLength(2);
      expect(result[0]).toStrictEqual(mockStoredGrantedPermission);
      expect(result[1]?.permissionResponse.context).toBe(
        encodeDelegations([mockDelegationTwo]),
      );
    });

    it('should skip invalid permissions in batch operations', async () => {
      const validPermission = mockStoredGrantedPermission;
      const invalidPermission = {
        permissionResponse: { chainId: '0xaa36a7' }, // Missing required fields
        siteOrigin: 'https://example.com',
      } as any;

      mockPassAuth();

      await profileSyncManager.storeGrantedPermissionBatch([
        validPermission,
        invalidPermission,
      ]);

      expect(userStorageMock.batchSetItems).toHaveBeenCalledWith(
        'gator_7715_permissions',
        [
          [
            mockDelegationHash,
            expect.stringMatching(
              /^\{"permissionResponse":\{.*\},"siteOrigin":"https:\/\/example\.com"\}$/u,
            ),
          ],
        ],
      );
      // Verify the stored data can be parsed and contains expected fields
      const batchCalls = userStorageMock.batchSetItems.mock.calls[0]?.[1];
      expect(batchCalls).toBeDefined();
      expect(batchCalls).toHaveLength(1);
      const storedData = JSON.parse((batchCalls as any)[0]?.[1] as string);
      expect(storedData.permissionResponse.chainId).toBe('0xaa36a7');
      expect(storedData.permissionResponse.address).toBe(
        '0x1234567890123456789012345678901234567890',
      );
      expect(storedData.siteOrigin).toBe('https://example.com');
    });
  });

  describe('Profile Sync feature disabled using unConfigured profile sync manager', () => {
    beforeEach(() => {
      profileSyncManager = createProfileSyncManager({
        isFeatureEnabled: false,
        auth: jwtBearerAuthMock,
        userStorage: userStorageMock,
      });
    });

    describe('getAllGrantedPermissions', () => {
      it('should return empty array when profile sync feature is disabled', async () => {
        const res = await profileSyncManager.getAllGrantedPermissions();
        expect(res).toStrictEqual([]);
      });
    });

    describe('getGrantedPermission', () => {
      it('should throw error when profile sync feature is disabled', async () => {
        await expect(
          profileSyncManager.getGrantedPermission(
            '0x00_some_permission_context' as Hex,
          ),
        ).rejects.toThrow(
          'unConfiguredProfileSyncManager.getPermissionByHash not implemented',
        );
      });
    });

    describe('storeGrantedPermission', () => {
      it('should not store granted permission when profile sync feature is disabled', async () => {
        await profileSyncManager.storeGrantedPermission(
          mockStoredGrantedPermission,
        );
        expect(userStorageMock.setItem).not.toHaveBeenCalled();
      });
    });

    describe('storeGrantedPermissionBatch', () => {
      it('should not store granted permissions when profile sync feature is disabled', async () => {
        await profileSyncManager.storeGrantedPermissionBatch([
          mockStoredGrantedPermission,
        ]);
        expect(userStorageMock.batchSetItems).not.toHaveBeenCalled();
      });
    });
  });
});
