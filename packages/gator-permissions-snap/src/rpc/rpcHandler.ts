import { logger } from '@metamask/7715-permissions-shared/utils';
import {
  InvalidInputError,
  UserRejectedRequestError,
  type Json,
} from '@metamask/snaps-sdk';
import { hexToNumber } from '@metamask/utils';

import type { PermissionHandlerFactory } from '../core/permissionHandlerFactory';
import { DEFAULT_GATOR_PERMISSION_TO_OFFER } from '../permissions/permissionOffers';
import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../profileSync/profileSync';
import {
  validatePermissionRequestParam,
  validateRevocationParams,
} from '../utils/validate';

/**
 * Type for the RPC handler methods.
 */
export type RpcHandler = {
  /**
   * Handles grant permission requests.
   *
   * @param params - The parameters for the grant permission request.
   * @returns The result of the grant permission request.
   */
  grantPermission(params?: Json): Promise<Json>;

  /**
   * Handles get permission offers requests.
   *
   * @returns The permission offers.
   */
  getPermissionOffers(): Promise<Json>;

  /**
   * Handles get granted permissions requests.
   *
   * @param params - Optional parameters for filtering permissions.
   * @returns The granted permissions, optionally filtered.
   */
  getGrantedPermissions(params?: Json): Promise<Json>;

  /**
   * Handles submit revocation requests.
   *
   * @param params - The parameters for the revocation.
   * @returns Success confirmation.
   */
  submitRevocation(params: Json): Promise<Json>;
};

/**
 * Creates an RPC handler with methods for handling permission-related RPC requests.
 *
 * @param config - The parameters for creating the RPC handler.
 * @param config.permissionHandlerFactory - The factory for creating permission handlers.
 * @param config.profileSyncManager - The profile sync manager.
 * @param config.supportedChainIds - The supported chain IDs.
 * @returns An object with RPC handler methods.
 */
export function createRpcHandler({
  permissionHandlerFactory,
  profileSyncManager,
  supportedChainIds,
}: {
  permissionHandlerFactory: PermissionHandlerFactory;
  profileSyncManager: ProfileSyncManager;
  supportedChainIds: number[];
}): RpcHandler {
  /**
   * Handles grant permission requests.
   *
   * @param params - The parameters for the grant permission request.
   * @returns The result of the grant permission request.
   */
  const grantPermission = async (params?: Json): Promise<Json> => {
    logger.debug('grantPermissions()', params);
    const { permissionsRequest, siteOrigin } =
      validatePermissionRequestParam(params);

    const unsupportedChainIds = permissionsRequest
      .filter(
        (request) => !supportedChainIds.includes(hexToNumber(request.chainId)),
      )
      .map((request) => request.chainId);

    if (unsupportedChainIds.length > 0) {
      throw new InvalidInputError(
        `Unsupported chain IDs: ${unsupportedChainIds.join(', ')}`,
      );
    }

    const permissionsToStore: StoredGrantedPermission[] = [];

    // First, process all permissions to collect responses and validate all are approved
    for (const request of permissionsRequest) {
      const handler = permissionHandlerFactory.createPermissionHandler(request);

      const permissionResponse =
        await handler.handlePermissionRequest(siteOrigin);

      if (!permissionResponse.approved) {
        throw new UserRejectedRequestError(permissionResponse.reason);
      }

      const storedPermission: StoredGrantedPermission = {
        permissionResponse: permissionResponse.response,
        siteOrigin,
        isRevoked: false,
      };
      permissionsToStore.push(storedPermission);
    }

    // Only after all permissions have been successfully processed, store them all in batch
    if (permissionsToStore.length > 0) {
      await profileSyncManager.storeGrantedPermissionBatch(permissionsToStore);
    }

    // Return the permission responses
    return permissionsToStore.map(
      (permission) => permission.permissionResponse as Json,
    );
  };

  /**
   * Handles get permission offers requests.
   *
   * @returns The permission offers.
   */
  const getPermissionOffers = async (): Promise<Json> => {
    logger.debug('getPermissionOffers()');
    return DEFAULT_GATOR_PERMISSION_TO_OFFER as Json[];
  };

  /**
   * Handles get granted permissions requests.
   *
   * @param params - Optional parameters for filtering permissions.
   * @returns The granted permissions, optionally filtered.
   */
  const getGrantedPermissions = async (params?: Json): Promise<Json> => {
    logger.debug('getGrantedPermissions()', params);

    // Get all permissions
    const allPermissions = await profileSyncManager.getAllGrantedPermissions();

    // If no params provided, return all permissions (backward compatibility)
    if (!params || typeof params !== 'object') {
      return allPermissions as Json[];
    }

    // Parse filtering options
    const { isRevoked, siteOrigin, chainId, delegationManager } = params as {
      isRevoked?: boolean;
      siteOrigin?: string;
      chainId?: string;
      delegationManager?: string;
    };

    // Apply filters
    let filteredPermissions = allPermissions;

    if (typeof isRevoked === 'boolean') {
      filteredPermissions = filteredPermissions.filter(
        (permission) => permission.isRevoked === isRevoked,
      );
    }

    if (typeof siteOrigin === 'string') {
      filteredPermissions = filteredPermissions.filter(
        (permission) => permission.siteOrigin === siteOrigin,
      );
    }

    if (typeof chainId === 'string') {
      filteredPermissions = filteredPermissions.filter(
        (permission) => permission.permissionResponse.chainId === chainId,
      );
    }

    if (typeof delegationManager === 'string') {
      filteredPermissions = filteredPermissions.filter(
        (permission) =>
          permission.permissionResponse.signerMeta.delegationManager ===
          delegationManager,
      );
    }

    return filteredPermissions as Json[];
  };

  /**
   * Handles submit revocation requests.
   *
   * @param params - The parameters for the revocation.
   * @returns Success confirmation.
   */
  const submitRevocation = async (params: Json): Promise<Json> => {
    logger.debug('submitRevocation() called with params:', params);

    const { permissionContext } = validateRevocationParams(params);

    await profileSyncManager.updatePermissionRevocationStatus(
      permissionContext,
      true,
    );

    return { success: true };
  };

  return {
    grantPermission,
    getPermissionOffers,
    getGrantedPermissions,
    submitRevocation,
  };
}
