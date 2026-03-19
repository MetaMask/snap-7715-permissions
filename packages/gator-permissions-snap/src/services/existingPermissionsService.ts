import { Permission } from '@metamask/7715-permissions-shared/types';

import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../profileSync/profileSync';

/**
 * Status of existing permissions for a site with respect to the currently requested permission.
 * Used to drive a single network call and one UI decision (banner type or none).
 */
export type ExistingPermissionsStatus = 'none' | 'existing_only' | 'similar';

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
      const matching = allPermissions.filter(
        (permission) =>
          permission.revocationMetadata === undefined &&
          permission.siteOrigin.toLowerCase() === siteOrigin.toLowerCase(),
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
    return existingPermissions.some(
      (stored) =>
        stored.permissionResponse.permission.type === requestedPermission.type,
    );
  }

  /**
   * Fetches existing permissions once and returns a single status for the permission flow.
   * Use this instead of calling hasExistingPermissions and similarPermissionsExist
   * separately to avoid duplicate network roundtrips to the storage API.
   *
   * @param siteOrigin - The origin of the requesting dApp.
   * @param requestedPermission - The permission being requested (for similarity check).
   * @returns 'none' if no existing permissions; 'similar' if any match the requested type; 'existing_only' otherwise.
   */
  async getExistingPermissionsStatus(
    siteOrigin: string,
    requestedPermission: Permission,
  ): Promise<ExistingPermissionsStatus> {
    const existingPermissions = await this.getExistingPermissions(siteOrigin);
    if (existingPermissions.length === 0) {
      return 'none';
    }
    const hasSimilar = existingPermissions.some(
      (stored) =>
        stored.permissionResponse.permission.type === requestedPermission.type,
    );
    return hasSimilar ? 'similar' : 'existing_only';
  }
}
