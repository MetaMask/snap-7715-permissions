import type { PermissionResponse } from '@metamask/7715-permissions-shared/types';
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
   * @returns The granted permissions.
   */
  getGrantedPermissions(): Promise<Json>;

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

    const permissionsToStore: {
      permissionResponse: PermissionResponse;
      siteOrigin: string;
    }[] = [];

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
      await profileSyncManager.storeGrantedPermissionBatch(
        permissionsToStore as StoredGrantedPermission[],
      );
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
   * @returns The granted permissions.
   */
  const getGrantedPermissions = async (): Promise<Json> => {
    logger.debug('getGrantedPermissions()');
    const grantedPermission =
      await profileSyncManager.getAllGrantedPermissions();
    return grantedPermission as Json[];
  };

  /**
   * Handles submit revocation requests.
   *
   * @param params - The parameters for the revocation.
   * @returns Success confirmation.
   */
  const submitRevocation = async (params: Json): Promise<Json> => {
    console.log('================================================2');
    logger.debug('=== SUBMIT REVOCATION RPC CALLED ===');
    logger.debug('submitRevocation() called with params:', params);
    logger.debug('Params type:', typeof params);
    logger.debug('Params stringified:', JSON.stringify(params, null, 2));

    const { delegationHash } = validateRevocationParams(params);
    logger.debug('Validated delegationHash:', delegationHash);

    // First, get the existing permission to validate it exists
    logger.debug(
      'Looking up existing permission for delegationHash:',
      delegationHash,
    );
    const existingPermission =
      await profileSyncManager.getGrantedPermissionByDelegationHash(
        delegationHash,
      );

    if (!existingPermission) {
      logger.debug(
        '❌ Permission not found for delegationHash:',
        delegationHash,
      );
      throw new InvalidInputError(
        `Permission not found for delegation hash: ${delegationHash}`,
      );
    }

    logger.debug('✅ Found existing permission:', {
      delegationHash,
      isRevoked: existingPermission.isRevoked,
      siteOrigin: existingPermission.siteOrigin,
    });

    // Extract delegationManager and chainId from the permission response for logging
    const { chainId: permissionChainId, signerMeta } =
      existingPermission.permissionResponse;
    const { delegationManager } = signerMeta;

    logger.debug('Permission details extracted:', {
      chainId: permissionChainId,
      delegationManager: delegationManager ?? 'undefined',
      signerMeta: signerMeta,
    });

    // Check if the delegation is actually disabled on-chain
    if (!delegationManager) {
      logger.debug('❌ No delegation manager found');
      throw new InvalidInputError(
        `No delegation manager found for delegation hash: ${delegationHash}`,
      );
    }

    logger.debug('Checking if delegation is disabled on-chain...', {
      delegationHash,
      chainId: permissionChainId,
      delegationManager,
    });

    const isDelegationDisabled =
      await profileSyncManager.checkDelegationDisabledOnChain(
        delegationHash,
        permissionChainId,
        delegationManager,
      );

    logger.debug('On-chain check result:', { isDelegationDisabled });

    if (!isDelegationDisabled) {
      logger.debug('❌ Delegation is not disabled on-chain');
      throw new InvalidInputError(
        `Delegation ${delegationHash} is not disabled on-chain. Cannot process revocation.`,
      );
    }

    logger.debug(
      '✅ Delegation is disabled on-chain, proceeding with revocation',
    );

    // Update the permission's revocation status using the optimized method
    // This avoids re-fetching the permission we already have
    logger.debug('Updating permission revocation status to true...');
    await profileSyncManager.updatePermissionRevocationStatusWithPermission(
      existingPermission,
      true,
    );

    logger.debug('✅ Revocation completed successfully');
    logger.debug('=== SUBMIT REVOCATION RPC COMPLETED ===');
    return { success: true };
  };

  return {
    grantPermission,
    getPermissionOffers,
    getGrantedPermissions,
    submitRevocation,
  };
}
