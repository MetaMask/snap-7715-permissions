import type { Permission } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import { InternalError } from '@metamask/snaps-sdk';

import type { StoredGrantedPermission } from '../../profileSync/profileSync';
import { createCallOnceGuard } from '../callOnceGuard';
import type { DialogInterface } from '../dialogInterface';
import type { ExistingPermissionsService } from '../existingpermissions';
import { ExistingPermissionsState } from '../existingpermissions/existingPermissionsState';

/**
 * Prefetches existing-permissions snapshot data and manages the existing-permissions subview.
 * One instance per permission request; {@link prefetch} must only be called once.
 */
export class ExistingPermissionsCoordinator {
  readonly #existingPermissionsService: ExistingPermissionsService;

  #snapshotPromise: Promise<StoredGrantedPermission[]> | undefined;

  #statusPromise: Promise<ExistingPermissionsState> | undefined;

  readonly #callOnceGuard = createCallOnceGuard(
    'ExistingPermissionsCoordinator.prefetch()',
  );

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
   * @throws If called more than once on the same instance.
   */
  prefetch(origin: string, permission: Permission): void {
    this.#callOnceGuard();

    this.#snapshotPromise =
      this.#existingPermissionsService.getExistingPermissions(origin);

    // Chain .catch() so the promise never rejects: if the user cancels at intro we return
    // without awaiting it, and any processing error should not cause an unhandled rejection.
    this.#statusPromise = this.#snapshotPromise
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
  }

  /**
   * Returns the banner status derived from the prefetched snapshot.
   *
   * @returns Existing-permissions banner state for the confirmation UI.
   * @throws If {@link prefetch} has not been called.
   */
  async getStatus(): Promise<ExistingPermissionsState> {
    if (!this.#statusPromise) {
      throw new InternalError(
        'ExistingPermissionsCoordinator.getStatus() called before prefetch()',
      );
    }
    return this.#statusPromise;
  }

  /**
   * Shows the existing-permissions subview when the session enters it for the first time.
   *
   * @param args - Subview display parameters.
   * @param args.dialogInterface - Shared dialog interface for the request.
   * @param args.enteringSubview - Whether the subview is being entered for the first time.
   * @throws If {@link prefetch} has not been called.
   */
  async showSubview(args: {
    dialogInterface: DialogInterface;
    enteringSubview: boolean;
  }): Promise<void> {
    if (!this.#snapshotPromise) {
      throw new InternalError(
        'ExistingPermissionsCoordinator.showSubview() called before prefetch()',
      );
    }

    const { dialogInterface, enteringSubview } = args;

    if (!enteringSubview) {
      return;
    }

    const snapshot = await this.#snapshotPromise;
    await this.#existingPermissionsService.showExistingPermissions(
      dialogInterface,
      snapshot,
    );
  }
}
