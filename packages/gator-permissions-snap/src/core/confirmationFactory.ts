import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';

import type { UserEventDispatcher } from '../userEventDispatcher';
import { ConfirmationDialog } from './confirmation';
import type { TimeoutFactory } from './timeoutFactory';

/**
 * Factory for creating confirmation dialogs.
 */
export class ConfirmationDialogFactory {
  #snap: SnapsProvider;

  #userEventDispatcher: UserEventDispatcher;

  #timeoutFactory: TimeoutFactory;

  constructor({
    snap,
    userEventDispatcher,
    timeoutFactory,
  }: {
    snap: SnapsProvider;
    userEventDispatcher: UserEventDispatcher;
    timeoutFactory: TimeoutFactory;
  }) {
    this.#snap = snap;
    this.#userEventDispatcher = userEventDispatcher;
    this.#timeoutFactory = timeoutFactory;
  }

  /**
   * Creates a confirmation dialog with the specified content.
   * @param params - The parameters for creating a confirmation dialog.
   * @param params.ui - The UI elements to be displayed in the confirmation dialog.
   * @param params.isGrantDisabled - Whether the user can grant the permission.
   * @param params.onBeforeGrant - Validation callback that runs before grant is confirmed.
   * @returns A promise that resolves with the confirmation dialog.
   */
  createConfirmation({
    ui,
    isGrantDisabled,
    onBeforeGrant,
  }: {
    ui: SnapElement;
    isGrantDisabled: boolean;
    onBeforeGrant: () => Promise<boolean>;
  }) {
    return new ConfirmationDialog({
      ui,
      isGrantDisabled,
      snaps: this.#snap,
      userEventDispatcher: this.#userEventDispatcher,
      onBeforeGrant,
      timeoutFactory: this.#timeoutFactory,
    });
  }
}
