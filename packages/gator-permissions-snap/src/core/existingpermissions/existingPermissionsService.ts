import type { PermissionRequest } from '@metamask/7715-permissions-shared/types';
import { UserInputEventType } from '@metamask/snaps-sdk';

import {
  buildExistingPermissionsContent,
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
   * Finds existing permissions matching the given request and origin.
   * Uses a filtering pattern similar to getGrantedPermissions in rpcHandler.
   * Filters by isRevoked, siteOrigin, chainId, and delegationManager.
   *
   * @param permissionRequest - The permission request to match.
   * @param siteOrigin - The origin of the requesting dApp.
   * @returns An array of matching stored permissions, or an empty array if not found.
   */
  async #findMatchingExistingPermission(
    permissionRequest: PermissionRequest,
    siteOrigin: string,
  ): Promise<StoredGrantedPermission[]> {
    const allPermissions =
      await this.#profileSyncManager.getAllGrantedPermissions();

    const matching = allPermissions.filter(
      (permission) =>
        permission.revocationMetadata === undefined &&
        permission.siteOrigin === siteOrigin &&
        permission.permissionResponse.chainId === permissionRequest.chainId,
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

      // Format permissions with token metadata
      const formattedPermissions = await Promise.all(
        existingPermissions.map(async (stored) =>
          formatPermissionWithTokenMetadata(
            stored.permissionResponse,
            this.#tokenMetadataService,
          ),
        ),
      );

      // Build configuration for the existing permissions display
      const config: ExistingPermissionDisplayConfig = {
        existingPermissions: formattedPermissions,
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
        const content = buildExistingPermissionsContent(config);

        dialogInterface
          .show(content, () => {
            unbindAll();
            resolve(false); // User cancelled via X button
          })
          .then((interfaceId) => {
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
