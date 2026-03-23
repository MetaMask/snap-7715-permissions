import type { Permission } from '@metamask/7715-permissions-shared/types';
import {
  extractDescriptorName,
  logger,
} from '@metamask/7715-permissions-shared/utils';

import {
  buildExistingPermissionsContent,
  buildExistingPermissionsSkeletonContent,
} from './existingPermissionsContent';
import { ExistingPermissionsState } from './existingPermissionsState';
import { formatPermissionWithTokenMetadata } from './permissionFormatter';
import type { ExistingPermissionDisplayConfig } from './types';
import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../../profileSync/profileSync';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import type { DialogInterface } from '../dialogInterface';

export { ExistingPermissionsState } from './existingPermissionsState';

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
 * Loads stored permissions for a site, classifies them against the current request for banner UI,
 * and builds the full existing-permissions review screen.
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
   * Entries without `permissionResponse.from` or `permissionResponse.chainId` are omitted.
   *
   * @param siteOrigin - The origin of the requesting dApp.
   * @returns Non-revoked stored grants for the origin, or an empty array on failure or if none match.
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

  /**
   * Builds the full-screen list of stored permissions (formatted for display) and a confirm control.
   *
   * @param existingPermissions - Stored grants to render; typically from {@link getExistingPermissions}.
   * @returns JSX for the existing-permissions review container.
   */
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

  /**
   * Compares stored grants for the site to the requested permission (stream vs periodic category).
   *
   * @param siteOrigin - The requesting dApp origin.
   * @param requestedPermission - The permission the user is about to grant.
   * @returns Banner-driving status, or {@link ExistingPermissionsState.None} if none stored or on error.
   */
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

  /**
   * Shows existing permissions in a dialog with skeleton loading state.
   * First displays a skeleton placeholder, then updates with actual formatted content.
   *
   * @param dialogInterface - The dialog interface to show content in.
   * @param siteOrigin - The origin of the requesting dApp.
   */
  async showExistingPermissions(
    dialogInterface: DialogInterface,
    siteOrigin: string,
  ): Promise<void> {
    try {
      // Show skeleton immediately with configuration for UI labels
      const skeletonConfig: ExistingPermissionDisplayConfig = {
        existingPermissions: [],
        title: 'existingPermissionsTitle',
        description: 'existingPermissionsDescription',
        buttonLabel: 'existingPermissionsConfirmButton',
      };
      await dialogInterface.show(
        buildExistingPermissionsSkeletonContent(skeletonConfig),
      );

      // Load and format permissions in the background
      const existingPermissions = await this.getExistingPermissions(siteOrigin);
      const formattedContent =
        await this.createExistingPermissionsContent(existingPermissions);

      // Update dialog with actual content
      await dialogInterface.show(formattedContent);
    } catch (error) {
      logger.error(
        'ExistingPermissionsService.showExistingPermissions() failed',
        {
          siteOrigin,
          error: error instanceof Error ? error.message : error,
        },
      );
      // Dialog continues gracefully even if formatting fails
    }
  }
}
