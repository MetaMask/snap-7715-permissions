import { Permission } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';

import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../profileSync/profileSync';

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

  constructor({
    profileSyncManager,
  }: {
    profileSyncManager: ProfileSyncManager;
  }) {
    this.#profileSyncManager = profileSyncManager;
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
      const normalizedOrigin = siteOrigin.toLowerCase();
      const matching = allPermissions.filter(
        (permission) =>
          permission.revocationMetadata === undefined &&
          permission.siteOrigin.toLowerCase() === normalizedOrigin,
      );

      return matching;
    } catch {
      return [];
    }
  }

  async hasExistingPermissions(siteOrigin: string): Promise<boolean> {
    const existingPermissions = await this.getExistingPermissions(siteOrigin);
    return existingPermissions.length > 0;
  }

  async similarPermissionsExist(
    siteOrigin: string,
    requestedPermission: Permission,
  ): Promise<boolean> {
    const existingPermissions = await this.getExistingPermissions(siteOrigin);
    const requestedCategory = extractPermissionCategory(
      extractDescriptorName(requestedPermission.type),
    );
    // Only treat as similar when both have a recognized category (stream/periodic) and they match.
    // Unrecognized types (e.g. revocation) return null; null === null would falsely mark them as similar.
    if (requestedCategory === null) {
      return false;
    }
    return existingPermissions.some((stored) => {
      const storedCategory = extractPermissionCategory(
        extractDescriptorName(stored.permissionResponse.permission.type),
      );
      return storedCategory !== null && storedCategory === requestedCategory;
    });
  }

  /**
   * Fetches existing permissions once and returns a single status for the permission flow.
   * Use this instead of calling hasExistingPermissions and similarPermissionsExist
   * separately to avoid duplicate network roundtrips to the storage API.
   *
   * @param siteOrigin - The origin of the requesting dApp.
   * @param requestedPermission - The permission being requested (for similarity check).
   * @returns None if no existing permissions; SimilarPermissions if any match the requested type; DissimilarPermissions otherwise.
   */
  async getExistingPermissionsStatus(
    siteOrigin: string,
    requestedPermission: Permission,
  ): Promise<ExistingPermissionsState> {
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
        return storedCategory !== null && storedCategory === requestedCategory;
      });
    return hasSimilar
      ? ExistingPermissionsState.SimilarPermissions
      : ExistingPermissionsState.DissimilarPermissions;
  }
}
