import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { UserInputEventType } from '@metamask/snaps-sdk';

import {
  buildExistingPermissionsContent,
  buildExistingPermissionsSkeletonContent,
  EXISTING_PERMISSIONS_CONFIRM_BUTTON,
} from './existingPermissionsContent';
import { formatPermissionWithTokenMetadata } from './permissionFormatter';
import type { ExistingPermissionDisplayConfig } from './types';
import type {
  ProfileSyncManager,
  StoredGrantedPermission,
} from '../../profileSync/profileSync';
import type { TokenMetadataService } from '../../services/tokenMetadataService';
import type { UserEventDispatcher } from '../../userEventDispatcher';
import type { DialogInterface } from '../dialogInterface';

/**
 * Service for displaying existing permissions when a dApp requests new ones.
 * Provides UI for showing the comparison between existing and requested permissions.
 */
export class ExistingPermissionsService {
  readonly #profileSyncManager: ProfileSyncManager;

  readonly #userEventDispatcher: UserEventDispatcher;

  readonly #tokenMetadataService: TokenMetadataService;

  constructor({
    profileSyncManager,
    userEventDispatcher,
    tokenMetadataService,
  }: {
    profileSyncManager: ProfileSyncManager;
    userEventDispatcher: UserEventDispatcher;
    tokenMetadataService: TokenMetadataService;
  }) {
    this.#profileSyncManager = profileSyncManager;
    this.#userEventDispatcher = userEventDispatcher;
    this.#tokenMetadataService = tokenMetadataService;
  }

  /**
   * Finds existing permissions matching the given origin.
   * Returns all permissions granted to the origin across all chains (not limited to the requested chainId).
   * Filters by isRevoked and siteOrigin only.
   *
   * @param _permissionRequest - The permission request (kept for API compatibility, not used for filtering).
   * @param siteOrigin - The origin of the requesting dApp.
   * @returns An array of matching stored permissions across all chains, or an empty array if not found.
   */
  async #findMatchingExistingPermission(
    _permissionRequest: PermissionRequest,
    siteOrigin: string,
  ): Promise<StoredGrantedPermission[]> {
    const allPermissions =
      await this.#profileSyncManager.getAllGrantedPermissions();

    // Return all non-revoked permissions for the origin across all chains
    const matching = allPermissions.filter(
      (permission) =>
        permission.revocationMetadata === undefined &&
        permission.siteOrigin === siteOrigin,
    );

    return matching;
  }

  /**
   * Gets existing permissions matching the given request.
   * @param permissionRequest - The permission request to check.
   * @param siteOrigin - The origin of the requesting dApp.
   * @returns An array of matching stored permissions, or an empty array if not found.
   */
  async getExistingPermissions(
    permissionRequest: PermissionRequest,
    siteOrigin: string,
  ): Promise<StoredGrantedPermission[]> {
    try {
      return await this.#findMatchingExistingPermission(
        permissionRequest,
        siteOrigin,
      );
    } catch {
      return [];
    }
  }

  /**
   * Shows the existing permissions dialog and waits for user acknowledgement.
   * @param options - The options object.
   * @param options.dialogInterface - The dialog interface to use for displaying content.
   * @param options.existingPermissions - The existing permissions to display.
   * @returns Object with wasCancelled flag indicating if user dismissed the dialog.
   */
  async showExistingPermissions({
    dialogInterface,
    existingPermissions,
  }: {
    dialogInterface: DialogInterface;
    existingPermissions: StoredGrantedPermission[] | undefined;
  }): Promise<{ wasCancelled: boolean }> {
    try {
      if (!existingPermissions || existingPermissions.length === 0) {
        return { wasCancelled: false };
      }

      // Validate permissions before displaying them
      // A permission is valid if it has both 'from' and 'chainId' fields
      const validPermissions = existingPermissions.filter(
        (stored) =>
          stored.permissionResponse.from && stored.permissionResponse.chainId,
      );

      // If all permissions are invalid, treat as no existing permissions
      if (validPermissions.length === 0) {
        return { wasCancelled: false };
      }

      // Build configuration for the skeleton display (shown immediately)
      const config: ExistingPermissionDisplayConfig = {
        existingPermissions: [],
        title: 'existingPermissionsTitle',
        description: 'existingPermissionsDescription',
        buttonLabel: 'existingPermissionsConfirmButton',
      };

      // Track unbind functions to clean up handlers
      const unbindFunctions: (() => void)[] = [];

      // Helper to cleanup all event handlers
      const unbindAll = (): void => {
        unbindFunctions.forEach((fn) => fn());
      };

      const wasConfirmed = await new Promise<boolean>((resolve) => {
        // Show skeleton immediately
        const skeletonContent = buildExistingPermissionsSkeletonContent(config);

        dialogInterface
          .show(skeletonContent, () => {
            unbindAll();
            resolve(false); // User cancelled via X button
          })
          .then(async (interfaceId) => {
            try {
              // Format permissions with token metadata (this may take time)
              const formattedPermissions = await Promise.all(
                validPermissions.map(async (stored) =>
                  formatPermissionWithTokenMetadata(
                    stored.permissionResponse,
                    this.#tokenMetadataService,
                  ),
                ),
              );

              // Build configuration for the actual permissions display
              const actualConfig: ExistingPermissionDisplayConfig = {
                existingPermissions: formattedPermissions,
                title: 'existingPermissionsTitle',
                description: 'existingPermissionsDescription',
                buttonLabel: 'existingPermissionsConfirmButton',
              };

              // Update dialog with actual content
              const actualContent =
                buildExistingPermissionsContent(actualConfig);
              await dialogInterface.show(actualContent);
            } catch {
              // If formatting fails, dialog still shows with skeleton
              // This is acceptable - user can still interact with the dialog
            }

            // Handler for acknowledge button
            const { unbind: unbindConfirm } = this.#userEventDispatcher.on({
              elementName: EXISTING_PERMISSIONS_CONFIRM_BUTTON,
              eventType: UserInputEventType.ButtonClickEvent,
              interfaceId,
              handler: async () => {
                unbindAll();
                resolve(true); // User acknowledged
              },
            });
            unbindFunctions.push(unbindConfirm);

            return undefined;
          })
          .catch(() => {
            unbindAll();
            resolve(false); // Error = treat as cancelled
          });
      });

      return { wasCancelled: !wasConfirmed };
    } catch {
      // If anything goes wrong, just return false to continue with the flow
      return { wasCancelled: false };
    }
  }
}
