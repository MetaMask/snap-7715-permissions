import type { Permission } from '@metamask/7715-permissions-shared/types';
import { logger } from '@metamask/7715-permissions-shared/utils';
import { InternalError } from '@metamask/snaps-sdk';

import type { StoredGrantedPermission } from '../../profileSync/profileSync';
import type { DialogInterface } from '../dialogInterface';
import type { ExistingPermissionsService } from '../existingpermissions';
import { ExistingPermissionsState } from '../existingpermissions/existingPermissionsState';
import type { BaseContext } from '../types';

/**
 * Prefetches existing-permissions snapshot data and manages the existing-permissions subview.
 * One instance per permission request; {@link prefetch} must only be called once.
 */
export class ExistingPermissionsCoordinator {
  readonly #existingPermissionsService: ExistingPermissionsService;

  #prefetched = false;

  #snapshotPromise: Promise<StoredGrantedPermission[]> | undefined;

  #statusPromise: Promise<ExistingPermissionsState> | undefined;

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
    if (this.#prefetched) {
      throw new InternalError(
        'ExistingPermissionsCoordinator.prefetch() called more than once',
      );
    }
    this.#prefetched = true;

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
   * Shows the existing-permissions subview when requested by context.
   *
   * @param args - Subview display parameters.
   * @param args.dialogInterface - Shared dialog interface for the request.
   * @param args.context - Current confirmation context.
   * @param args.enteringSubview - Whether the subview is being entered for the first time.
   * @returns `handled: true` when the caller should skip the normal confirmation content update.
   * @throws If {@link prefetch} has not been called.
   */
  async maybeShowSubview(args: {
    dialogInterface: DialogInterface;
    context: BaseContext;
    enteringSubview: boolean;
  }): Promise<{ handled: boolean }> {
    if (!this.#snapshotPromise) {
      throw new InternalError(
        'ExistingPermissionsCoordinator.maybeShowSubview() called before prefetch()',
      );
    }

    const { dialogInterface, context, enteringSubview } = args;

    if (context.showExistingPermissions) {
      if (enteringSubview) {
        const snapshot = await this.#snapshotPromise;
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
