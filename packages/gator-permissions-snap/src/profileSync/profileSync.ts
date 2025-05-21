/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  Delegation,
  DelegationStruct,
} from '@metamask/delegation-toolkit';
import { getDelegationHashOffchain } from '@metamask/delegation-toolkit';
import type {
  UserStorageGenericPathWithFeatureAndKey,
  JwtBearerAuth,
  UserStorage,
} from '@metamask/profile-sync-controller/sdk';
import { ethers } from 'ethers';
import { concat, getAddress, toHex, type Hex } from 'viem';

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
 *
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
      throw new Error(
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
   * Converts a DelegationStruct to a Delegation.
   * The DelegationStruct is the format used in the Delegation Framework.
   *
   * @param delegationStruct - The delegation struct to format.
   * @returns The delegation.
   */
  function convertToDelegation(delegationStruct: DelegationStruct): Delegation {
    const caveats = delegationStruct.caveats.map((caveat) => ({
      enforcer: getAddress(caveat.enforcer),
      terms: caveat.terms,
      args: caveat.args,
    }));
    return {
      delegate: getAddress(delegationStruct.delegate),
      delegator: getAddress(delegationStruct.delegator),
      authority: delegationStruct.authority,
      caveats,
      salt: toHex(delegationStruct.salt),
      signature: delegationStruct.signature,
    };
  }

  /**
   * ABI Decodes a permissions context.
   *
   * @param permissionsContext - The encoded delegation(ie. permissions context).
   * @returns The decoded delegations.
   */
  function decodeDelegation(permissionsContext: Hex): Delegation[] {
    // TODO: Viem throws error: during test: Expected 0 arguments, but got 2.
    // Using ethers to decode the delegation.
    // const [decodedDelegationStructs] = decodeAbiParameters(
    //   [
    //     {
    //       components: DELEGATION_ABI_TYPE_COMPONENTS,
    //       name: 'delegations',
    //       type: 'tuple[]',
    //     },
    //   ],
    //   permissionsContext,
    // );

    const abiType = [
      'tuple(address delegate, address delegator, bytes32 authority, ' +
        'tuple(address enforcer, bytes terms, bytes args)[] caveats, ' +
        'uint256 salt, bytes signature)[]',
    ];

    const [decodedDelegationStructs] = ethers.utils.defaultAbiCoder.decode(
      abiType,
      permissionsContext,
    );

    return (decodedDelegationStructs as DelegationStruct[]).map(
      convertToDelegation,
    );
  }

  /**
   * Generates an object key for the permission response stored in profile sync.
   *
   * @param permissionContext - The encoded delegation(ie. permissions context).
   * @returns The object key by concatenating the delegation hashes.
   */
  function generateObjectKey(permissionContext: Hex): Hex {
    const delegations = decodeDelegation(permissionContext);
    return concat(delegations.map(getDelegationHashOffchain));
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
   *
   * @returns All granted permissions.
   */
  async function getAllGrantedPermissions(): Promise<
    StoredGrantedPermission[]
  > {
    try {
      await authenticate();

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
      await authenticate();

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
      await authenticate();

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
      await authenticate();

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
