import type { Permission } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';

import type { StoredGrantedPermission } from '../../profileSync/profileSync';
import type { DialogInterface } from '../dialogInterface';
import type { ExistingPermissionsService } from '../existingpermissions';
import { ExistingPermissionsState } from '../existingpermissions/existingPermissionsState';
import type { BaseContext } from '../types';

/**
 * Prefetches existing-permissions snapshot data and manages the existing-permissions subview.
 */
export class ExistingPermissionsCoordinator {
  readonly #existingPermissionsService: ExistingPermissionsService;

  constructor({
    existingPermissionsService,
  }: {
    existingPermissionsService: ExistingPermissionsService;
  }) {
    this.#existingPermissionsService = existingPermissionsService;
  }

  /**
   * Starts a single profile-sync read per permission request.
   * The snapshot drives both the banner and the "review existing" list.
   *
   * @param origin - Site origin for the permission request.
   * @param permission - Permission being requested.
   * @returns Promises for the stored snapshot and derived banner state.
   */
  prefetch(
    origin: string,
    permission: Permission,
  ): {
    snapshotPromise: Promise<StoredGrantedPermission[]>;
    statusPromise: Promise<ExistingPermissionsState>;
  } {
    const snapshotPromise =
      this.#existingPermissionsService.getExistingPermissions(origin);

    // Chain .catch() so the promise never rejects: if the user cancels at intro we return
    // without awaiting it, and any processing error should not cause an unhandled rejection.
    const statusPromise = snapshotPromise
      .then((list) =>
        this.#existingPermissionsService.getExistingPermissionsStatusFromList(
          list,
          permission,
        ),
      )
      .catch((error: unknown) => {
        logger.error(
          'ExistingPermissionsCoordinator: existing permissions status from snapshot failed',
          {
            origin,
            error: error instanceof Error ? error.message : error,
          },
        );
        return ExistingPermissionsState.None;
      });

    return { snapshotPromise, statusPromise };
  }

  /**
   * Shows the existing-permissions subview when requested by context.
   *
   * @param args - Subview display parameters.
   * @param args.dialogInterface - Shared dialog interface for the request.
   * @param args.context - Current confirmation context.
   * @param args.enteringSubview - Whether the subview is being entered for the first time.
   * @param args.snapshotPromise - Prefetched stored permissions for the origin.
   * @returns `handled: true` when the caller should skip the normal confirmation content update.
   */
  async maybeShowSubview(args: {
    dialogInterface: DialogInterface;
    context: BaseContext;
    enteringSubview: boolean;
    snapshotPromise: Promise<StoredGrantedPermission[]>;
  }): Promise<{ handled: boolean }> {
    const { dialogInterface, context, enteringSubview, snapshotPromise } = args;

    if (context.showExistingPermissions) {
      if (enteringSubview) {
        const snapshot = await snapshotPromise;
        await this.#existingPermissionsService.showExistingPermissions(
          dialogInterface,
          snapshot,
        );
      }

      return { handled: true };
    }

    return { handled: false };
  }
}
