/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { zPermissionResponse } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  hashDelegation,
  decodeDelegations,
  type Hex,
} from '@metamask/delegation-core';
import type {
  UserStorageGenericPathWithFeatureAndKey,
  JwtBearerAuth,
  UserStorage,
} from '@metamask/profile-sync-controller/sdk';
import {
  InvalidInputError,
  LimitExceededError,
  ParseError,
  UnsupportedMethodError,
} from '@metamask/snaps-sdk';
import { z } from 'zod';

// Constants for validation
const MAX_STORAGE_SIZE_BYTES = 400 * 1024; // 400kb limit as documented

// Zod schema for runtime validation of StoredGrantedPermission
const zStoredGrantedPermission = z.object({
  permissionResponse: zPermissionResponse,
  siteOrigin: z.string().min(1, 'Site origin cannot be empty'),
});

/**
 * Safely deserializes and validates a JSON string as StoredGrantedPermission.
 * @param jsonString - The JSON string to deserialize.
 * @returns The validated StoredGrantedPermission object.
 * @throws InvalidInputError if validation fails.
 * @throws ParseError if parsing fails.
 */
function safeDeserializeStoredGrantedPermission(
  jsonString: string,
): StoredGrantedPermission {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = zStoredGrantedPermission.parse(parsed);
    return validated;
  } catch (error) {
    logger.error('Error deserializing stored granted permission:', error);
    if (error instanceof z.ZodError) {
      throw new InvalidInputError(
        `Invalid permission data structure: ${error.errors.map((zodError) => `${zodError.path.join('.')}: ${zodError.message}`).join(', ')}`,
      );
    }
    throw new ParseError(`Failed to parse JSON`);
  }
}

/**
 * Safely serializes a StoredGrantedPermission object with size validation.
 * @param permission - The permission object to serialize.
 * @returns The JSON string.
 * @throws LimitExceededError if size limit exceeded.
 */
function safeSerializeStoredGrantedPermission(
  permission: StoredGrantedPermission,
): string {
  try {
    // Validate the object structure first
    const validated = zStoredGrantedPermission.parse(permission);

    // Serialize to JSON
    const jsonString = JSON.stringify(validated);

    // Check size limit
    const sizeBytes = new TextEncoder().encode(jsonString).length;
    if (sizeBytes > MAX_STORAGE_SIZE_BYTES) {
      throw new LimitExceededError(
        `Permission data exceeds size limit: ${sizeBytes} bytes > ${MAX_STORAGE_SIZE_BYTES} bytes`,
      );
    }

    return jsonString;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new InvalidInputError(
        `Invalid permission data structure: ${error.errors.map((zodError) => `${zodError.path.join('.')}: ${zodError.message}`).join(', ')}`,
      );
    }
    throw error;
  }
}

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
  isFeatureEnabled: boolean;
};

/**
 * Creates a profile sync manager.
 * @param config - The profile sync manager config.
 * @returns A profile sync manager.
 */
export function createProfileSyncManager(
  config: ProfileSyncManagerConfig,
): ProfileSyncManager {
  const FEATURE = 'gator_7715_permissions';
  const { auth, userStorage, isFeatureEnabled } = config;
  const unConfiguredProfileSyncManager = {
    getAllGrantedPermissions: async () => {
      logger.debug('unConfiguredProfileSyncManager.getAllGrantedPermissions()');
      return [];
    },
    getGrantedPermission: async (_: Hex) => {
      throw new UnsupportedMethodError(
        'unConfiguredProfileSyncManager.getPermissionByHash not implemented',
      );
    },
    storeGrantedPermission: async (_: StoredGrantedPermission) => {
      logger.debug(
        'unConfiguredProfileSyncManager.storeGrantedPermissionBatch()',
      );
    },
    storeGrantedPermissionBatch: async (_: StoredGrantedPermission[]) => {
      logger.debug(
        'unConfiguredProfileSyncManager.storeGrantedPermissionBatch()',
      );
    },
  };

  /**
   * Generates an object key for the permission response stored in profile sync.
   * @param permissionContext - The encoded delegation(ie. permissions context).
   * @returns The object key by concatenating the delegation hashes.
   */
  function generateObjectKey(permissionContext: Hex): Hex {
    const delegations = decodeDelegations(permissionContext);
    const hashes = delegations.map((delegation) =>
      hashDelegation(delegation).slice(2),
    );

    return `0x${hashes.join('')}`;
  }

  /**
   * Authenticates the user with profile sync.
   *
   */
  async function authenticate(): Promise<void> {
    try {
      await auth.getAccessToken();
    } catch (error) {
      logger.error('Error fetching access token:', error);
      throw error;
    }
  }

  /**
   * Retrieve all granted permission items under the "7715_permissions" feature will result in GET /api/v1/userstorage/7715_permissions
   * VALUES: decrypted("JSONstringifyPermission1", storage_key), decrypted("JSONstringifyPermission2", storage_key).
   * @returns All granted permissions.
   */
  async function getAllGrantedPermissions(): Promise<
    StoredGrantedPermission[]
  > {
    try {
      await authenticate();

      const items = await userStorage.getAllFeatureItems(FEATURE);
      if (!items) {
        return [];
      }

      const validPermissions: StoredGrantedPermission[] = [];

      for (const item of items) {
        try {
          const permission = safeDeserializeStoredGrantedPermission(item);
          validPermissions.push(permission);
        } catch (error) {
          logger.warn('Skipping invalid permission data:', error);
        }
      }

      return validPermissions;
    } catch (error) {
      logger.error('Error fetching all granted permissions:', error);
      throw error;
    }
  }

  /**
   * Retrieve a granted permission by context using query "<permissionContext>" key from the "7715_permissions" feature will result in GET /api/v1/userstorage/7715_permissions/Hash(<storage_key+<permissionContext>>)
   * VALUE: decrypted("JSONstringifyPermission", storage_key).
   * @param permissionContext - The context of the granted permission.
   * @returns The granted permission or null if the permission is not found.
   */
  async function getGrantedPermission(
    permissionContext: Hex,
  ): Promise<StoredGrantedPermission | null> {
    try {
      await authenticate();

      const path: UserStorageGenericPathWithFeatureAndKey = `${FEATURE}.${generateObjectKey(permissionContext)}`;
      const permission = await userStorage.getItem(path);

      if (!permission) {
        return null;
      }

      return safeDeserializeStoredGrantedPermission(permission);
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
   * Runtime schema validation is enforced to prevent corrupted data storage
   * will result in PUT /api/v1/userstorage/gator_7715_permissions/Hash(<storage_key+<permissionContext>">)
   * VALUE: encrypted("JSONstringifyPermission", storage_key).
   * @param storedGrantedPermission - The permission response to store.
   */
  async function storeGrantedPermission(
    storedGrantedPermission: StoredGrantedPermission,
  ): Promise<void> {
    try {
      await authenticate();

      // Validate and serialize with size check
      const serializedPermission = safeSerializeStoredGrantedPermission(
        storedGrantedPermission,
      );

      const path: UserStorageGenericPathWithFeatureAndKey = `${FEATURE}.${generateObjectKey(storedGrantedPermission.permissionResponse.context)}`;
      await userStorage.setItem(path, serializedPermission);
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
   * Runtime schema validation is enforced to prevent corrupted data storage
   * will result in PUT /api/v1/userstorage/gator_7715_permissions/
   * VALUES: encrypted("JSONstringifyPermission1", storage_key), encrypted("JSONstringifyPermission2", storage_key).
   * @param storedGrantedPermissions - The permission responses to store.
   */
  async function storeGrantedPermissionBatch(
    storedGrantedPermissions: StoredGrantedPermission[],
  ): Promise<void> {
    try {
      await authenticate();

      // Validate and serialize all permissions with size checks
      const validatedItems: [string, string][] = [];

      for (const permission of storedGrantedPermissions) {
        try {
          const serializedPermission =
            safeSerializeStoredGrantedPermission(permission);
          validatedItems.push([
            generateObjectKey(permission.permissionResponse.context), // key
            serializedPermission, // value
          ]);
        } catch (error) {
          logger.warn('Skipping invalid permission in batch:', error);
        }
      }

      if (validatedItems.length === 0) {
        throw new InvalidInputError(
          'No valid permissions to store in batch operation',
        );
      }

      await userStorage.batchSetItems(FEATURE, validatedItems);
    } catch (error) {
      logger.error('Error storing granted permission batch:', error);
      throw error;
    }
  }

  /**
   * Feature flag to disable profile sync feature until message-signing-snap v1.1.2 released in MM 12.18: https://github.com/MetaMask/metamask-extension/pull/32521.
   */
  return isFeatureEnabled
    ? {
        getAllGrantedPermissions,
        getGrantedPermission,
        storeGrantedPermission,
        storeGrantedPermissionBatch,
      }
    : unConfiguredProfileSyncManager;
}
