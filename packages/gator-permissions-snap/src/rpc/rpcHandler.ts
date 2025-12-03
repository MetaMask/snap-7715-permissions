import { logger } from '@metamask/7715-permissions-shared/utils';
import { decodeDelegations, hashDelegation } from '@metamask/delegation-core';
import {
  InvalidInputError,
  UserRejectedRequestError,
} from '@metamask/snaps-sdk';
import type { Json } from '@metamask/snaps-sdk';

import type { BlockchainTokenMetadataClient } from '../clients/blockchainMetadataClient';
import type { PermissionHandlerFactory } from '../core/permissionHandlerFactory';
import { DEFAULT_GATOR_PERMISSION_TO_OFFER } from '../permissions/permissionOffers';
import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../profileSync/profileSync';
import {
  validateGetGrantedPermissionsParams,
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
 * @param config.blockchainMetadataClient - The blockchain metadata client for on-chain checks.
 * @returns An object with RPC handler methods.
 */
export function createRpcHandler({
  permissionHandlerFactory,
  profileSyncManager,
  blockchainMetadataClient,
}: {
  permissionHandlerFactory: PermissionHandlerFactory;
  profileSyncManager: ProfileSyncManager;
  blockchainMetadataClient: BlockchainTokenMetadataClient;
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

    // If no params provided, return all permissions for backward compatibility.
    if (!params || typeof params !== 'object') {
      // we duplicate the call to getAllGrantedPermissions here, to avoid having
      // to branch the validation logic when params is specified.
      return (await profileSyncManager.getAllGrantedPermissions()) as Json[];
    }

    const { isRevoked, siteOrigin, chainId, delegationManager } =
      validateGetGrantedPermissionsParams(params);

    // Get all permissions
    const allPermissions = await profileSyncManager.getAllGrantedPermissions();

    // Use validated filtering options

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

    const { permissionContext, txHash } = validateRevocationParams(params);

    // First, get the existing permission to validate it exists
    logger.debug(
      'Looking up existing permission for permissionContext:',
      permissionContext,
    );
    const existingPermission =
      await profileSyncManager.getGrantedPermission(permissionContext);

    if (!existingPermission) {
      throw new InvalidInputError(
        `Permission not found for permission context: ${permissionContext}`,
      );
    }

    // Extract delegationManager and chainId from the permission response for logging
    const { chainId: permissionChainId, signerMeta } =
      existingPermission.permissionResponse;
    const { delegationManager } = signerMeta;

    logger.debug('Permission details extracted:', {
      chainId: permissionChainId,
      delegationManager: delegationManager ?? 'undefined',
      signerMeta,
    });

    if (!delegationManager) {
      throw new InvalidInputError(
        `No delegation manager found for permission context: ${permissionContext}`,
      );
    }

    // For on-chain validation, we need to check each delegation in the context
    const delegations = decodeDelegations(permissionContext);

    // Only one delegation is allowed per permission context, taking the first one
    if (delegations.length > 1) {
      throw new InvalidInputError(
        `Multiple delegations found in permission context: ${permissionContext}`,
      );
    }
    const firstDelegation = delegations[0];
    if (!firstDelegation) {
      throw new InvalidInputError(
        `No delegations found in permission context: ${permissionContext}`,
      );
    }
    // Check if any delegation is disabled on-chain

    const delegationHash = hashDelegation(firstDelegation);
    const isDelegationDisabled =
      await blockchainMetadataClient.checkDelegationDisabledOnChain({
        delegationHash,
        chainId: permissionChainId,
        delegationManagerAddress: delegationManager,
      });

    if (!isDelegationDisabled) {
      throw new InvalidInputError(
        `Delegation ${delegationHash} is not disabled on-chain. Cannot process revocation.`,
      );
    }

    // TODO:Check that that provided transaction hash is valid using the blockchain metadata client

    await profileSyncManager.updatePermissionRevocationStatus(
      permissionContext,
      true,
      txHash,
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
