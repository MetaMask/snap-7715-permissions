import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import {
  zHexStr,
  zPermissionResponse,
  zTimestamp,
} from '@metamask/7715-permissions-shared/types';
import {
  logger,
  extractZodError,
} from '@metamask/7715-permissions-shared/utils';
import { hashDelegation, decodeDelegations } from '@metamask/delegation-core';
import type { Hex } from '@metamask/delegation-core';
import type {
  UserStorageGenericPathWithFeatureAndKey,
  JwtBearerAuth,
  UserStorage,
} from '@metamask/profile-sync-controller/sdk';
import {
  InternalError,
  InvalidInputError,
  ParseError,
  UnsupportedMethodError,
} from '@metamask/snaps-sdk';
import { z } from 'zod';

import type { SnapsMetricsService } from '../services/snapsMetricsService';

export type RevocationMetadata = {
  txHash?: Hex | undefined;
  recordedAt: number;
};

// Zod schema for runtime validation of StoredGrantedPermission
const zStoredGrantedPermission = z.object({
  permissionResponse: zPermissionResponse,
  siteOrigin: z.string().min(1, 'Site origin cannot be empty'),
  revocationMetadata: z
    .object({
      txHash: zHexStr.optional(),
      recordedAt: zTimestamp,
    })
    .optional(),
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

    // handle legacy storage where `isRevoked` is set instead of `revocationMetadata`
    if (parsed.isRevoked && validated.revocationMetadata === undefined) {
      validated.revocationMetadata = {
        // We haven't persisted the `recordedAt` timestamp, so we just use the
        // current timestamp to indicate that it was "noticed" just now. This
        // should never really happen in production, as only permissions revoked
        // with pre-production versions would have been marked with `isRevoked`
        // instead of `revocationMetadata`. The value is inconsequential, as
        // it's only included for debugging purposes.
        recordedAt: Math.floor(Date.now() / 1000),
      };
    }

    return validated;
  } catch (error) {
    logger.error('Error deserializing stored granted permission');
    if (error instanceof z.ZodError) {
      throw new InvalidInputError(extractZodError(error.errors));
    }
    throw new ParseError(`Failed to parse JSON`);
  }
}

/**
 * Safely serializes a StoredGrantedPermission object.
 * @param permission - The permission object to serialize.
 * @returns The JSON string.
 */
function safeSerializeStoredGrantedPermission(
  permission: StoredGrantedPermission,
): string {
  try {
    // Validate the object structure first
    const validated = zStoredGrantedPermission.parse(permission);

    // Serialize to JSON
    const jsonString = JSON.stringify(validated);

    return jsonString;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new InvalidInputError(extractZodError(error.errors));
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
  markPermissionRevoked: (
    permissionContext: Hex,
    revocationMetadata: RevocationMetadata,
  ) => Promise<void>;
};

export type StoredGrantedPermission = {
  permissionResponse: PermissionResponse;
  siteOrigin: string;
  revocationMetadata?: RevocationMetadata | undefined;
};

/**
 * Generates an object key for the permission response stored in profile sync.
 * @param permissionContext - The encoded delegation(ie. permissions context).
 * @returns The object key by concatenating the delegation hashes.
 */
export function generateObjectKey(permissionContext: Hex): Hex {
  const delegations = decodeDelegations(permissionContext);
  const hashes = delegations.map((delegation) =>
    hashDelegation(delegation).slice(2),
  );

  return `0x${hashes.join('')}`;
}

export type ProfileSyncManagerConfig = {
  userStorage: UserStorage;
  isFeatureEnabled: boolean;
  snapsMetricsService?: SnapsMetricsService;
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
  const { userStorage, isFeatureEnabled, snapsMetricsService } = config;
  const unConfiguredProfileSyncManager = {
    getAllGrantedPermissions: async (): Promise<StoredGrantedPermission[]> => {
      logger.debug('unConfiguredProfileSyncManager.getAllGrantedPermissions()');
      return [];
    },
    getGrantedPermission: async (_: Hex): Promise<StoredGrantedPermission> => {
      throw new UnsupportedMethodError(
        'unConfiguredProfileSyncManager.getPermissionByHash not implemented',
      );
    },
    storeGrantedPermission: async (
      _: StoredGrantedPermission,
    ): Promise<void> => {
      logger.debug(
        'unConfiguredProfileSyncManager.storeGrantedPermissionBatch()',
      );
    },
    storeGrantedPermissionBatch: async (
      _: StoredGrantedPermission[],
    ): Promise<void> => {
      logger.debug(
        'unConfiguredProfileSyncManager.storeGrantedPermissionBatch()',
      );
    },
    markPermissionRevoked: async (
      _permissionContext: Hex,
      _revocationMetadata: RevocationMetadata,
    ): Promise<void> => {
      logger.debug('unConfiguredProfileSyncManager.markPermissionRevoked()');
    },
  };

  /**
   * Retrieve all granted permission items under the "7715_permissions" feature will result in GET /api/v1/userstorage/7715_permissions
   * VALUES: decrypted("JSONstringifyPermission1", storage_key), decrypted("JSONstringifyPermission2", storage_key).
   * @returns All granted permissions.
   */
  async function getAllGrantedPermissions(): Promise<
    StoredGrantedPermission[]
  > {
    try {
      const items = await userStorage.getAllFeatureItems(FEATURE);
      if (!items) {
        await snapsMetricsService?.trackProfileSync({
          operation: 'retrieve',
          success: true,
        });
        return [];
      }

      const validPermissions: StoredGrantedPermission[] = [];

      for (const item of items) {
        try {
          const permission = safeDeserializeStoredGrantedPermission(item);
          validPermissions.push(permission);
        } catch {
          logger.warn('Skipping invalid permission data');
        }
      }

      await snapsMetricsService?.trackProfileSync({
        operation: 'retrieve',
        success: true,
      });
      return validPermissions;
    } catch (error) {
      logger.error('Error fetching all granted permissions');
      await snapsMetricsService?.trackProfileSync({
        operation: 'retrieve',
        success: false,
        errorMessage: (error as Error).message,
      });
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
      const path: UserStorageGenericPathWithFeatureAndKey = `${FEATURE}.${generateObjectKey(permissionContext)}`;
      const permission = await userStorage.getItem(path);

      if (!permission) {
        return null;
      }

      return safeDeserializeStoredGrantedPermission(permission);
    } catch (error) {
      logger.error('Error fetching granted permissions');
      throw error;
    }
  }

  /**
   * Validates that the stored permission value for the given key matches the expected value.
   *
   * Retrieves the item from user storage using the provided key and compares it to the expected value.
   * Throws an InternalError if the item does not exist or if the stored value does not match the expected value.
   *
   * @param key - The key for the item in user storage.
   * @param expectedValue - The expected serialized value to compare against the retrieved value.
   * @throws {InternalError} If the stored item is missing or does not match the expected value.
   */
  async function validatePermissionStored(
    key: string,
    expectedValue: string,
  ): Promise<void> {
    const path: UserStorageGenericPathWithFeatureAndKey = `${FEATURE}.${key}`;
    const retrievedValue = await userStorage.getItem(path);

    if (!retrievedValue) {
      throw new InternalError(
        `Unable to retrieve stored item with key: ${key}`,
      );
    }

    if (expectedValue !== retrievedValue) {
      throw new InternalError(
        `Retrieved stored item with key: ${key} but does not match expected value`,
      );
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
    const performanceData = {
      permissionCount: 1,
      permissionsStoredElapsedMs: -1,
      storedPermissionsValidatedElapsedMs: -1,
    };
    try {
      const startTime = Date.now();
      // Validate and serialize with size check
      const serializedPermission = safeSerializeStoredGrantedPermission(
        storedGrantedPermission,
      );

      const key = generateObjectKey(
        storedGrantedPermission.permissionResponse.context,
      );

      const path: UserStorageGenericPathWithFeatureAndKey = `${FEATURE}.${key}`;
      await userStorage.setItem(path, serializedPermission);

      performanceData.permissionsStoredElapsedMs = Date.now() - startTime;

      await validatePermissionStored(key, serializedPermission);

      performanceData.storedPermissionsValidatedElapsedMs =
        Date.now() - startTime;

      await snapsMetricsService?.trackProfileSync({
        operation: 'store',
        success: true,
        performanceData,
      });
    } catch (error) {
      logger.error('Error storing granted permission');
      await snapsMetricsService?.trackProfileSync({
        operation: 'store',
        success: false,
        errorMessage: (error as Error).message,
        performanceData,
      });
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
    const performanceData = {
      permissionCount: storedGrantedPermissions.length,
      permissionsStoredElapsedMs: -1,
      storedPermissionsValidatedElapsedMs: -1,
    };

    try {
      const startTime = Date.now();
      // Validate and serialize all permissions with size checks
      const validatedItems: [string, string][] = [];

      for (const permission of storedGrantedPermissions) {
        const serializedPermission =
          safeSerializeStoredGrantedPermission(permission);

        validatedItems.push([
          generateObjectKey(permission.permissionResponse.context), // key
          serializedPermission, // value
        ]);
      }

      if (validatedItems.length === 0) {
        throw new InvalidInputError(
          'No valid permissions to store in batch operation',
        );
      }

      await userStorage.batchSetItems(FEATURE, validatedItems);

      performanceData.permissionsStoredElapsedMs = Date.now() - startTime;

      // ensure that all items were stored correctly
      const fetchedItems = validatedItems.map(async ([key, value]) =>
        validatePermissionStored(key, value),
      );

      await Promise.all(fetchedItems);

      performanceData.storedPermissionsValidatedElapsedMs =
        Date.now() - startTime;

      await snapsMetricsService?.trackProfileSync({
        operation: 'batch_store',
        success: true,
        performanceData,
      });
    } catch (error) {
      logger.error('Error storing granted permission batch');
      await snapsMetricsService?.trackProfileSync({
        operation: 'batch_store',
        success: false,
        errorMessage: (error as Error).message,
        performanceData,
      });
      throw error;
    }
  }

  /**
   * Updates the revocation status of a granted permission.
   *
   * @param permissionContext - The context of the granted permission to update.
   * @param revocationMetadata - The revocation transaction metadata.
   */
  async function markPermissionRevoked(
    permissionContext: Hex,
    revocationMetadata: RevocationMetadata,
  ): Promise<void> {
    try {
      const existingPermission = await getGrantedPermission(permissionContext);

      if (!existingPermission) {
        throw new InvalidInputError(
          `Permission not found for permission context: ${permissionContext}`,
        );
      }

      if (existingPermission.revocationMetadata) {
        throw new InvalidInputError(
          `Permission already revoked for permission context: ${permissionContext}`,
        );
      }

      logger.debug('Marking permission as revoked:', {
        existingPermission,
        revocationMetadata,
      });

      const updatedPermission: StoredGrantedPermission = {
        ...existingPermission,
        revocationMetadata,
      };

      await storeGrantedPermission(updatedPermission);

      logger.debug('Profile Sync: Successfully stored updated permission');
    } catch (error) {
      logger.error('Error marking permission as revoked', error);
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
        markPermissionRevoked,
      }
    : unConfiguredProfileSyncManager;
}
