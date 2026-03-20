import { Permission } from '@metamask/7715-permissions-shared/types';

import { buildExistingPermissionsContent } from './existingPermissionsContent';
import { formatPermissionWithTokenMetadata } from './permissionFormatter';
import type { ExistingPermissionDisplayConfig } from './types';
import { extractDescriptorName } from '../../../../shared/src/utils/common';
import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../../profileSync/profileSync';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import type { UserEventDispatcher } from '../../userEventDispatcher';

/**
 * Extracts the category (stream or periodic) from a permission type.
 * E.g., 'native-token-stream' → 'stream', 'erc20-token-periodic' → 'periodic'
 * @param permissionTypeName - The permission type name to extract category from.
 * @returns The category ('stream' or 'periodic') or null if unrecognized.
 */
function extractPermissionCategory(
  permissionTypeName: string,
): 'stream' | 'periodic' | null {
  if (permissionTypeName.includes('stream')) {
    return 'stream';
  }
  if (permissionTypeName.includes('periodic')) {
    return 'periodic';
  }
  return null;
}

/**
 * Status of existing permissions for a site with respect to the currently requested permission.
 * Used to drive a single network call and one UI decision (banner type or none).
 */
export enum ExistingPermissionsState {
  None = 'None',
  DissimilarPermissions = 'DissimilarPermissions',
  SimilarPermissions = 'SimilarPermissions',
}

/**
 * Service for displaying existing permissions when a dApp requests new ones.
 * Provides UI for showing the comparison between existing and requested permissions.
 */
export class ExistingPermissionsService {
  readonly #profileSyncManager: ProfileSyncManager;

  readonly #tokenMetadataService: TokenMetadataService;

  constructor({
    profileSyncManager,
    tokenMetadataService,
  }: {
    profileSyncManager: ProfileSyncManager;
    userEventDispatcher: UserEventDispatcher;
    tokenMetadataService: TokenMetadataService;
  }) {
    this.#profileSyncManager = profileSyncManager;
    this.#tokenMetadataService = tokenMetadataService;
  }

  /**
   * Gets existing permissions matching the given origin.
   * @param siteOrigin - The origin of the requesting dApp.
   * @returns An array of matching stored permissions, or an empty array if not found.
   */
  async getExistingPermissions(
    siteOrigin: string,
  ): Promise<StoredGrantedPermission[]> {
    try {
      const allPermissions =
        await this.#profileSyncManager.getAllGrantedPermissions();

      // Return all non-revoked permissions for the origin across all chains
      const matching = allPermissions.filter(
        (permission) =>
          permission.revocationMetadata === undefined &&
          permission.siteOrigin.toLowerCase() === siteOrigin.toLowerCase() &&
          permission.permissionResponse.from &&
          permission.permissionResponse.chainId,
      );

      return matching;
    } catch {
      return [];
    }
  }

  async createExistingPermissionsContent(
    existingPermissions: StoredGrantedPermission[],
  ): Promise<JSX.Element> {
    const formattedPermissions = await Promise.all(
      existingPermissions.map(async (stored) =>
        formatPermissionWithTokenMetadata(
          stored.permissionResponse,
          this.#tokenMetadataService,
        ),
      ),
    );

    const config: ExistingPermissionDisplayConfig = {
      existingPermissions: formattedPermissions,
      title: 'existingPermissionsTitle',
      description: 'existingPermissionsDescription',
      buttonLabel: 'existingPermissionsConfirmButton',
    };

    return Promise.resolve(buildExistingPermissionsContent(config));
  }

  async getExistingPermissionsStatus(
    siteOrigin: string,
    requestedPermission: Permission,
  ): Promise<ExistingPermissionsState> {
    try {
      const existingPermissions = await this.getExistingPermissions(siteOrigin);
      if (existingPermissions.length === 0) {
        return ExistingPermissionsState.None;
      }
      const requestedCategory = extractPermissionCategory(
        extractDescriptorName(requestedPermission.type),
      );
      // Only treat as similar when both have a recognized category (stream/periodic) and they match.
      // Unrecognized types (e.g. revocation) return null; null === null would falsely mark them as similar.
      const hasSimilar =
        requestedCategory !== null &&
        existingPermissions.some((stored) => {
          const storedCategory = extractPermissionCategory(
            extractDescriptorName(stored.permissionResponse.permission.type),
          );
          return (
            storedCategory !== null && storedCategory === requestedCategory
          );
        });
      return hasSimilar
        ? ExistingPermissionsState.SimilarPermissions
        : ExistingPermissionsState.DissimilarPermissions;
    } catch {
      return ExistingPermissionsState.None;
    }
  }
}
