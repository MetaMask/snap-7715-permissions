/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  UserProfile,
  UserStorageGenericPathWithFeatureAndKey,
  JwtBearerAuth,
  UserStorage,
} from '@metamask/profile-sync-controller/sdk';
import type { Hex } from 'viem';

export type ProfileSyncManager = {
  getAllGrantedPermissions: () => Promise<StoredGrantedPermission[]>;
  getGrantedPermission: (
    permissionContext: Hex,
  ) => Promise<StoredGrantedPermission | null>;
  storeGrantedPermission: (
    storedGrantedPermission: StoredGrantedPermission,
  ) => Promise<void>;
  storeGrantedPermissionBatch: (
    storedGrantedPermission: StoredGrantedPermission[],
  ) => Promise<void>;
};

export type StoredGrantedPermission = {
  permissionResponse: PermissionResponse;
  siteOrigin: string;
};

export type ProfileSyncManagerConfig = {
  auth: JwtBearerAuth;
  userStorage: UserStorage;
  snapEnv: string | undefined;
};

/**
 * Creates a profile sync manager.
 *
 * @param config - The profile sync manager config.
 * @returns A profile sync manager.
 */
export function createProfileSyncManager(
  config: ProfileSyncManagerConfig,
): ProfileSyncManager {
  const FEATURE = 'gator_7715_permissions';
  const { auth, userStorage, snapEnv } = config;

  /**
   * Feature flag to only enable for local development until
   * message-signing-snap v1.1.2 released in MM 12.18: https://github.com/MetaMask/metamask-extension/pull/32521.
   *
   * @returns True if the feature is enabled, false otherwise.
   */
  function isFeatureEnabled(): boolean {
    return snapEnv === 'local';
  }

  /**
   * Retrieves the user profile.
   *
   * @returns The user profile.
   */
  async function getUserProfile(): Promise<UserProfile> {
    try {
      if (!isFeatureEnabled()) {
        throw new Error('Feature is not enabled');
      }

      await auth.getAccessToken();
      const profile = await auth.getUserProfile(); // retrieve the user profile information
      return profile;
    } catch (error) {
      logger.error('Error fetching access token:', error);
      throw error;
    }
  }

  /**
   * Retrieve all granted permission items under the "7715_permissions" feature will result in GET /api/v1/userstorage/7715_permissions
   * VALUES: decrypted("JSONstringifyPermission1", storage_key), decrypted("JSONstringifyPermission2", storage_key).
   *
   * @returns All granted permissions.
   */
  async function getAllGrantedPermissions(): Promise<
    StoredGrantedPermission[]
  > {
    try {
      if (!isFeatureEnabled()) {
        throw new Error('Feature is not enabled');
      }

      // Authenticate the user
      await getUserProfile();

      const items = await userStorage.getAllFeatureItems(FEATURE);
      return (
        items?.map((item) => JSON.parse(item) as StoredGrantedPermission) ?? []
      );
    } catch (error) {
      logger.error('Error fetching all granted permissions:', error);
      throw error;
    }
  }

  /**
   * Retrieve a granted permission by context using query "<permissionContext>" key from the "7715_permissions" feature will result in GET /api/v1/userstorage/7715_permissions/Hash(<storage_key+<permissionContext>>)
   * VALUE: decrypted("JSONstringifyPermission", storage_key).
   *
   * @param permissionContext - The context of the granted permission.
   * @returns The granted permission or null if the permission is not found.
   */
  async function getGrantedPermission(
    permissionContext: Hex,
  ): Promise<StoredGrantedPermission | null> {
    try {
      if (!isFeatureEnabled()) {
        throw new Error('Feature is not enabled');
      }

      // Authenticate the user
      await getUserProfile();

      const path: UserStorageGenericPathWithFeatureAndKey = `${FEATURE}.${permissionContext}`;
      const permission = await userStorage.getItem(path);

      return permission
        ? (JSON.parse(permission) as StoredGrantedPermission)
        : null;
    } catch (error) {
      logger.error('Error fetching granted permissions:', error);
      throw error;
    }
  }

  /**
   * Store the granted permission in profile sync.
   *
   * Persisting "<permissionContext>" key under "gator_7715_permissions" feature
   * value has to be serialized to string and does not exceed 400kb
   * it is up to the SDK consumer to enforce proper schema management
   * will result in PUT /api/v1/userstorage/gator_7715_permissions/Hash(<storage_key+<permissionContext>">)
   * VALUE: encrypted("JSONstringifyPermission", storage_key).
   *
   * @param storedGrantedPermission - The permission response to store.
   */
  async function storeGrantedPermission(
    storedGrantedPermission: StoredGrantedPermission,
  ): Promise<void> {
    try {
      if (!isFeatureEnabled()) {
        throw new Error('Feature is not enabled');
      }

      // Authenticate the user
      await getUserProfile();

      const path: UserStorageGenericPathWithFeatureAndKey = `${FEATURE}.${storedGrantedPermission.permissionResponse.context}`;
      await userStorage.setItem(path, JSON.stringify(storedGrantedPermission));
    } catch (error) {
      logger.error('Error storing granted permission:', error);
      throw error;
    }
  }

  /**
   * Store multiple granted permissions in profile sync.
   *
   * Batch set multiple items under the "gator_7715_permissions" feature
   * values have to be serialized to string and does not exceed 400kb
   * it is up to the SDK consumer to enforce proper schema management
   * will result in PUT /api/v1/userstorage/gator_7715_permissions/
   * VALUES: encrypted("JSONstringifyPermission1", storage_key), encrypted("JSONstringifyPermission2", storage_key).
   *
   * @param storedGrantedPermissions - The permission responses to store.
   */
  async function storeGrantedPermissionBatch(
    storedGrantedPermissions: StoredGrantedPermission[],
  ): Promise<void> {
    try {
      if (!isFeatureEnabled()) {
        throw new Error('Feature is not enabled');
      }

      // Authenticate the user
      await getUserProfile();

      await userStorage.batchSetItems(
        FEATURE,
        storedGrantedPermissions.map((storedGrantedPermission) => [
          storedGrantedPermission.permissionResponse.context, // key
          JSON.stringify(storedGrantedPermission), // value
        ]),
      );
    } catch (error) {
      logger.error('Error storing granted permission:', error);
      throw error;
    }
  }

  return {
    getAllGrantedPermissions,
    getGrantedPermission,
    storeGrantedPermission,
    storeGrantedPermissionBatch,
  };
}
