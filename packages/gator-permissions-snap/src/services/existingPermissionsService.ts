import { Permission } from '@metamask/7715-permissions-shared/types';

import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../profileSync/profileSync';
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

    // Implement logic to compare existing permissions with requested permissions
    // and determine if similar permissions already exist.
    // This is a placeholder and should be replaced with actual comparison logic.
    return existingPermissions.some((existingPermission) => {
      return (
        existingPermission.permissionResponse.permission.type ===
        requestedPermission.type
      );
    });
  }
}
