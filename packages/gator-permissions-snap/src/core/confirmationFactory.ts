import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';

import type { UserEventDispatcher } from '../userEventDispatcher';
import { ConfirmationDialog } from './confirmation';

/**
 * Factory for creating confirmation dialogs.
 */
export class ConfirmationDialogFactory {
  #snap: SnapsProvider;

  #userEventDispatcher: UserEventDispatcher;

  constructor({
    snap,
    userEventDispatcher,
  }: {
    snap: SnapsProvider;
    userEventDispatcher: UserEventDispatcher;
  }) {
    this.#snap = snap;
    this.#userEventDispatcher = userEventDispatcher;
  }

  /**
   * Creates a confirmation dialog with the specified content.
   * @param params - The parameters for creating a confirmation dialog.
   * @param params.ui - The UI elements to be displayed in the confirmation dialog.
   * @param params.isGrantDisabled - Whether the user can grant the permission.
   * @returns A promise that resolves with the confirmation dialog.
   */
  createConfirmation({
    ui,
    isGrantDisabled,
  }: {
    ui: GenericSnapElement;
    isGrantDisabled: boolean;
  }) {
    return new ConfirmationDialog({
      ui,
      isGrantDisabled,
      snaps: this.#snap,
      userEventDispatcher: this.#userEventDispatcher,
    });
  }
}
