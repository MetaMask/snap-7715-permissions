/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { zPermissionResponse } from '@metamask/7715-permissions-shared/types';
import {
  logger,
  extractZodError,
} from '@metamask/7715-permissions-shared/utils';
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
  type SnapsEthereumProvider,
} from '@metamask/snaps-sdk';
import { z } from 'zod';

import type { SnapsMetricsService } from '../services/snapsMetricsService';

// Constants for validation
const MAX_STORAGE_SIZE_BYTES = 400 * 1024; // 400kb limit as documented

// Zod schema for runtime validation of StoredGrantedPermission
const zStoredGrantedPermission = z.object({
  permissionResponse: zPermissionResponse,
  siteOrigin: z.string().min(1, 'Site origin cannot be empty'),
  isRevoked: z.boolean().default(false),
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
    logger.error('Error deserializing stored granted permission');
    if (error instanceof z.ZodError) {
      throw new InvalidInputError(extractZodError(error.errors));
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
  getGrantedPermissionByDelegationHash: (
    delegationHash: Hex,
  ) => Promise<StoredGrantedPermission | null>;
  storeGrantedPermission: (
    storedGrantedPermission: StoredGrantedPermission,
  ) => Promise<void>;
  storeGrantedPermissionBatch: (
    storedGrantedPermission: StoredGrantedPermission[],
  ) => Promise<void>;
  updatePermissionRevocationStatus: (
    permissionContext: Hex,
    isRevoked: boolean,
  ) => Promise<void>;
  updatePermissionRevocationStatusWithPermission: (
    existingPermission: StoredGrantedPermission,
    isRevoked: boolean,
  ) => Promise<void>;
  checkDelegationDisabledOnChain: (
    delegationHash: Hex,
    chainId: Hex,
    delegationManagerAddress: Hex,
  ) => Promise<boolean>;
};

export type StoredGrantedPermission = {
  permissionResponse: PermissionResponse;
  siteOrigin: string;
  isRevoked: boolean;
};

export type ProfileSyncManagerConfig = {
  auth: JwtBearerAuth;
  userStorage: UserStorage;
  isFeatureEnabled: boolean;
  snapsMetricsService?: SnapsMetricsService;
  ethereumProvider: SnapsEthereumProvider;
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
  const {
    auth,
    userStorage,
    isFeatureEnabled,
    snapsMetricsService,
    ethereumProvider,
  } = config;
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
    getGrantedPermissionByDelegationHash: async (_: Hex) => {
      logger.debug(
        'unConfiguredProfileSyncManager.getGrantedPermissionByDelegationHash()',
      );
      return null;
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
    updatePermissionRevocationStatus: async (_: Hex, __: boolean) => {
      logger.debug(
        'unConfiguredProfileSyncManager.updatePermissionRevocationStatus()',
      );
    },
    updatePermissionRevocationStatusWithPermission: async (
      _: StoredGrantedPermission,
      __: boolean,
    ) => {
      logger.debug(
        'unConfiguredProfileSyncManager.updatePermissionRevocationStatusWithPermission()',
      );
    },
    checkDelegationDisabledOnChain: async (_: Hex, __: Hex, ___: Hex) => {
      logger.debug(
        'unConfiguredProfileSyncManager.checkDelegationDisabledOnChain()',
      );
      return false; // Default to not disabled when feature is disabled
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
      logger.error('Error fetching access token');
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
        } catch (error) {
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
      await authenticate();

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
   * Retrieve a granted permission by delegation hash using direct storage lookup.
   * Since delegation hashes are unique, we can use them directly as storage keys.
   * @param delegationHash - The delegation hash to search for.
   * @returns The granted permission or null if not found.
   */
  async function getGrantedPermissionByDelegationHash(
    delegationHash: Hex,
  ): Promise<StoredGrantedPermission | null> {
    try {
      await authenticate();

      // Use the delegation hash directly as the storage key
      const path: UserStorageGenericPathWithFeatureAndKey = `${FEATURE}.${delegationHash}`;

      const permission = await userStorage.getItem(path);

      if (!permission) {
        return null;
      }

      return safeDeserializeStoredGrantedPermission(permission);
    } catch (error) {
      logger.error('Error fetching permission by delegation hash');
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

      await snapsMetricsService?.trackProfileSync({
        operation: 'store',
        success: true,
      });
    } catch (error) {
      logger.error('Error storing granted permission');
      await snapsMetricsService?.trackProfileSync({
        operation: 'store',
        success: false,
        errorMessage: (error as Error).message,
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
          logger.warn('Skipping invalid permission in batch');
        }
      }

      if (validatedItems.length === 0) {
        throw new InvalidInputError(
          'No valid permissions to store in batch operation',
        );
      }

      await userStorage.batchSetItems(FEATURE, validatedItems);

      await snapsMetricsService?.trackProfileSync({
        operation: 'batch_store',
        success: true,
      });
    } catch (error) {
      logger.error('Error storing granted permission batch');
      await snapsMetricsService?.trackProfileSync({
        operation: 'batch_store',
        success: false,
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Updates the revocation status of a granted permission in profile sync.
   *
   * @param permissionContext - The context of the granted permission to update.
   * @param isRevoked - The new revocation status.
   * @throws InvalidInputError if the permission is not found.
   */
  async function updatePermissionRevocationStatus(
    permissionContext: Hex,
    isRevoked: boolean,
  ): Promise<void> {
    try {
      await authenticate();

      // First, get the existing permission
      const existingPermission = await getGrantedPermission(permissionContext);
      if (!existingPermission) {
        throw new InvalidInputError(
          `Permission not found for delegation hash: ${permissionContext}`,
        );
      }

      // Use the optimized version that accepts the existing permission
      await updatePermissionRevocationStatusWithPermission(
        existingPermission,
        isRevoked,
      );
    } catch (error) {
      logger.error('Error updating permission revocation status');
      throw error;
    }
  }

  /**
   * Updates the revocation status of a granted permission when you already have the permission object.
   * This is an optimized version that avoids re-fetching the permission.
   *
   * @param existingPermission - The existing permission object.
   * @param isRevoked - The new revocation status.
   */
  async function updatePermissionRevocationStatusWithPermission(
    existingPermission: StoredGrantedPermission,
    isRevoked: boolean,
  ): Promise<void> {
    try {
      await authenticate();

      // Update the isRevoked flag
      const updatedPermission: StoredGrantedPermission = {
        ...existingPermission,
        isRevoked,
      };

      // Store the updated permission
      await storeGrantedPermission(updatedPermission);
    } catch (error) {
      logger.error(
        'Error updating permission revocation status with existing permission',
      );
      throw error;
    }
  }

  /**
   * Checks if a delegation is disabled on-chain by calling the DelegationManager contract.
   * @param delegationHash - The hash of the delegation to check.
   * @param chainId - The chain ID in hex format.
   * @param delegationManagerAddress - The address of the DelegationManager contract.
   * @returns True if the delegation is disabled, false otherwise.
   */
  async function checkDelegationDisabledOnChain(
    delegationHash: Hex,
    chainId: Hex,
    delegationManagerAddress: Hex,
  ): Promise<boolean> {
    try {
      logger.debug('Checking delegation disabled status on-chain', {
        delegationHash,
        chainId,
        delegationManagerAddress,
      });

      // Encode the function call data for disabledDelegations(bytes32)
      const functionSelector = '0x2d40d052'; // keccak256("disabledDelegations(bytes32)").slice(0, 10)
      const encodedParams = delegationHash.slice(2).padStart(64, '0'); // Remove 0x and pad to 32 bytes
      const callData = `${functionSelector}${encodedParams}`;

      const result = await ethereumProvider.request<Hex>({
        method: 'eth_call',
        params: [
          {
            to: delegationManagerAddress,
            data: callData,
          },
          'latest',
        ],
      });

      if (!result) {
        logger.warn('No result from contract call');
        return false;
      }

      // Parse the boolean result (32 bytes, last byte is the boolean value)
      const isDisabled =
        result !==
        '0x0000000000000000000000000000000000000000000000000000000000000000';

      logger.debug('Delegation disabled status result', { isDisabled });
      return isDisabled;
    } catch (error) {
      logger.error('Error checking delegation disabled status on-chain', error);
      // In case of error, assume not disabled to avoid blocking legitimate operations
      return false;
    }
  }

  /**
   * Feature flag to disable profile sync feature until message-signing-snap v1.1.2 released in MM 12.18: https://github.com/MetaMask/metamask-extension/pull/32521.
   */
  return isFeatureEnabled
    ? {
        getAllGrantedPermissions,
        getGrantedPermission,
        getGrantedPermissionByDelegationHash,
        storeGrantedPermission,
        storeGrantedPermissionBatch,
        updatePermissionRevocationStatus,
        updatePermissionRevocationStatusWithPermission,
        checkDelegationDisabledOnChain,
      }
    : unConfiguredProfileSyncManager;
}
