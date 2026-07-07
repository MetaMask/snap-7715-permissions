import type { Permission } from '@metamask/7715-permissions-shared/types';
import type { Hex } from '@metamask/utils';

import type { SnapsMetricsService } from '../../services/snapsMetricsService';
import type { DialogInterface } from '../dialogInterface';
import type { PermissionIntroductionService } from '../permissionIntroduction';

/**
 * Result of running the permission introduction step.
 */
export type IntroductionPhaseResult = { cancelled: boolean };

/**
 * Wraps first-time permission introduction UI, rejection metrics, and seen-state updates.
 * Does not own dialog creation; callers pass the shared {@link DialogInterface}.
 */
export class IntroductionPhase {
  readonly #permissionIntroductionService: PermissionIntroductionService;

  readonly #snapsMetricsService: SnapsMetricsService;

  constructor({
    permissionIntroductionService,
    snapsMetricsService,
  }: {
    permissionIntroductionService: PermissionIntroductionService;
    snapsMetricsService: SnapsMetricsService;
  }) {
    this.#permissionIntroductionService = permissionIntroductionService;
    this.#snapsMetricsService = snapsMetricsService;
  }

  /**
   * Returns whether the introduction screen should be shown for a permission type.
   *
   * @param permissionType - Descriptor name of the permission type.
   * @returns Whether the intro has not yet been seen for this type.
   */
  async shouldShow(permissionType: string): Promise<boolean> {
    return await this.#permissionIntroductionService.shouldShowIntroduction(
      permissionType,
    );
  }

  /**
   * Shows the introduction screen when needed and records rejection or seen state.
   *
   * @param args - Dialog interface, permission metadata, and site origin.
   * @param args.dialogInterface - Shared dialog interface for the request.
   * @param args.permissionType - Descriptor name of the permission type.
   * @param args.origin - Site origin for the permission request.
   * @param args.chainId - Chain ID for rejection metrics.
   * @param args.permission - Permission object for rejection metrics.
   * @returns Whether the user cancelled at the introduction screen.
   */
  async run(args: {
    dialogInterface: DialogInterface;
    permissionType: string;
    origin: string;
    chainId: Hex;
    permission: Permission;
  }): Promise<IntroductionPhaseResult> {
    const { dialogInterface, permissionType, origin, chainId, permission } =
      args;

    const { wasCancelled } =
      await this.#permissionIntroductionService.showIntroduction({
        dialogInterface,
        permissionType,
      });

    if (wasCancelled) {
      await this.#snapsMetricsService.trackPermissionRejected({
        origin,
        permissionType,
        chainId,
        permissionData: permission.data,
      });

      return { cancelled: true };
    }

    await this.#permissionIntroductionService.markIntroductionAsSeen(
      permissionType,
    );

    return { cancelled: false };
  }
}
