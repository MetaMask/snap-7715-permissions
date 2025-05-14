/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  Delegation,
  DelegationStruct,
} from '@metamask/delegation-toolkit';
import {
  DELEGATION_ABI_TYPE_COMPONENTS,
  getDelegationHashOffchain,
} from '@metamask/delegation-toolkit';
import type {
  UserProfile,
  UserStorageGenericPathWithFeatureAndKey,
  JwtBearerAuth,
  UserStorage,
} from '@metamask/profile-sync-controller/sdk';
import { decodeAbiParameters, toHex, type Hex } from 'viem';

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
 * Converts a DelegationStruct to a Delegation.
 * The DelegationStruct is the format used in the Delegation Framework.
 *
 * @param delegationStruct - The delegation struct to format.
 * @returns The delegation.
 */
const convertToDelegation = (
  delegationStruct: DelegationStruct,
): Delegation => {
  return {
    ...delegationStruct,
    salt: toHex(delegationStruct.salt),
  };
};

/**
 * ABI Decodes a permissions context.
 *
 * @param permissionsContext - The encoded delegation(ie. permissions context).
 * @returns The decoded delegations.
 */
const decodeDelegation = (permissionsContext: Hex): Delegation[] => {
  const [decodedDelegationStructs] = decodeAbiParameters(
    [
      {
        components: DELEGATION_ABI_TYPE_COMPONENTS,
        name: 'delegations',
        type: 'tuple[]',
      },
    ],
    permissionsContext,
  );

  return (decodedDelegationStructs as DelegationStruct[]).map(
    convertToDelegation,
  );
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
   * Generates an object key for the permission response stored in profile sync.
   *
   * @param permissionContext - The encoded delegation(ie. permissions context).
   * @returns The object key.
   */
  function generateObjectKey(permissionContext: Hex): Hex {
    const delegations = decodeDelegation(permissionContext);
    const delegation = delegations[0];
    if (!delegation) {
      throw new Error('No delegation found');
    }

    return getDelegationHashOffchain(delegation);
  }

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

      const path: UserStorageGenericPathWithFeatureAndKey = `${FEATURE}.${generateObjectKey(permissionContext)}`;
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

      const path: UserStorageGenericPathWithFeatureAndKey = `${FEATURE}.${generateObjectKey(storedGrantedPermission.permissionResponse.context)}`;
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
          generateObjectKey(storedGrantedPermission.permissionResponse.context), // key
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
