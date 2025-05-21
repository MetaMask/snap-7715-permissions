import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { LoginResponse } from '@metamask/profile-sync-controller/sdk';

import type { StateManager } from '../src/stateManagement';
import { createStateManager } from '../src/stateManagement';

describe('KernelStateManager', () => {
  let stateManager: StateManager;
  const mockSnapsProvider = createMockSnapsProvider();
  const mockLoginResponse: LoginResponse = {
    token: {
      accessToken: 'auth.test',
      expiresIn: 1000,
      obtainedAt: 1000,
    },
    profile: {
      identifierId: 'identifier.test',
      profileId: 'profile.test',
      metaMetricsId: 'meta.metrics.test',
    },
  };

  beforeEach(() => {
    mockSnapsProvider.request.mockReset();
    stateManager = createStateManager(mockSnapsProvider);
  });

  describe('getState', () => {
    it('should return the default state when no state is retrieved', async () => {
      mockSnapsProvider.request.mockResolvedValueOnce(null);

      const result = await stateManager.getState();
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'get',
          encrypted: true,
        },
      });
      expect(result).toStrictEqual({
        profileSyncAuthenticationSession: null,
        profileSyncUserStorageKey: null,
      });
    });

    it('should return stored profile sync authentication session and user storage key', async () => {
      mockSnapsProvider.request.mockResolvedValueOnce({
        profileSyncAuthenticationSession: mockLoginResponse,
        profileSyncUserStorageKey: 'user.storage.test',
      });

      const { profileSyncAuthenticationSession, profileSyncUserStorageKey } =
        await stateManager.getState();
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'get',
          encrypted: true,
        },
      });
      expect(profileSyncAuthenticationSession).toBe(mockLoginResponse);
      expect(profileSyncUserStorageKey).toBe('user.storage.test');
    });

    it('throw Error if the operation fails when attempting to get state', async () => {
      mockSnapsProvider.request.mockRejectedValue(
        new Error('Failed to get state'),
      );

      await expect(stateManager.getState()).rejects.toThrow(
        'Failed to get state',
      );
    });
  });

  describe('setState', () => {
    it('should update profile sync authentication session and user storage key', async () => {
      await stateManager.setState({
        profileSyncAuthenticationSession: mockLoginResponse,
        profileSyncUserStorageKey: 'user.storage.test',
      });

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: expect.objectContaining({
            profileSyncAuthenticationSession: mockLoginResponse,
            profileSyncUserStorageKey: 'user.storage.test',
          }),
          encrypted: true,
        },
      });
    });

    it('throw Error if the operation fails when attempting to update state', async () => {
      mockSnapsProvider.request.mockRejectedValue(
        new Error('Failed to update state'),
      );

      await expect(
        stateManager.setState({
          profileSyncAuthenticationSession: mockLoginResponse,
          profileSyncUserStorageKey: 'user.storage.test',
        }),
      ).rejects.toThrow('Failed to set state');
    });
  });
});
