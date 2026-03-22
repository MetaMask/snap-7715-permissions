import type { Permission } from '@metamask/7715-permissions-shared/types';
import {
  extractDescriptorName,
  logger,
} from '@metamask/7715-permissions-shared/utils';

import { buildExistingPermissionsContent } from './existingPermissionsContent';
import { formatPermissionWithTokenMetadata } from './permissionFormatter';
import type { ExistingPermissionDisplayConfig } from './types';
import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../../profileSync/profileSync';
import type { TokenMetadataService } from '../../services/tokenMetadataService';

/**
 * Extracts the category (stream or periodic) from a permission type name.
 * Uses suffix checks so unrelated names that merely contain "stream" as a substring are not misclassified.
 *
 * @param permissionTypeName - The permission type name to extract category from.
 * @returns The category ('stream' or 'periodic') or null if unrecognized.
 */
function extractPermissionCategory(
  permissionTypeName: string,
): 'stream' | 'periodic' | null {
  if (permissionTypeName.endsWith('-periodic')) {
    return 'periodic';
  }
  if (permissionTypeName.endsWith('-stream')) {
    return 'stream';
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
 * Loads stored permissions for a site and builds the existing-permissions review UI (banner + full list).
 */
export class ExistingPermissionsService {
  readonly #profileSyncManager: ProfileSyncManager;

  readonly #tokenMetadataService: TokenMetadataService;

  constructor({
    profileSyncManager,
    tokenMetadataService,
  }: {
    profileSyncManager: ProfileSyncManager;
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
    } catch (error) {
      logger.error(
        'ExistingPermissionsService.getExistingPermissions() failed',
        {
          siteOrigin,
          error: error instanceof Error ? error.message : error,
        },
      );
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

    return buildExistingPermissionsContent(config);
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
    } catch (error) {
      logger.error(
        'ExistingPermissionsService.getExistingPermissionsStatus() failed',
        {
          siteOrigin,
          error: error instanceof Error ? error.message : error,
        },
      );
      return ExistingPermissionsState.None;
    }
  }
}
