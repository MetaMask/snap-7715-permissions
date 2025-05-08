import type {
  JwtBearerAuth,
  UserStorage,
} from '@metamask/profile-sync-controller/sdk';

import {
  createProfileSyncManager,
  type ProfileSyncManager,
} from '../../src/profileSync';

describe('profileSync', () => {
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
        identifierId: '0x123',
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
});
