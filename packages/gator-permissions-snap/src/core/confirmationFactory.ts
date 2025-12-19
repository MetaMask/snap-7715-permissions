import type { SnapElement } from '@metamask/snaps-sdk/jsx';

import type { UserEventDispatcher } from '../userEventDispatcher';
import { ConfirmationDialog } from './confirmation';
import type { DialogInterface } from './dialogInterface';
import type { TimeoutFactory } from './timeoutFactory';

/**
 * Factory for creating confirmation dialogs.
 */
export class ConfirmationDialogFactory {
  #userEventDispatcher: UserEventDispatcher;

  #timeoutFactory: TimeoutFactory;

  constructor({
    userEventDispatcher,
    timeoutFactory,
  }: {
    userEventDispatcher: UserEventDispatcher;
    timeoutFactory: TimeoutFactory;
  }) {
    this.#userEventDispatcher = userEventDispatcher;
    this.#timeoutFactory = timeoutFactory;
  }

  /**
   * Creates a confirmation dialog with the specified content.
   * @param params - The parameters for creating a confirmation dialog.
   * @param params.dialogInterface - The dialog interface manager for showing content.
   * @param params.ui - The UI elements to be displayed in the confirmation dialog.
   * @param params.onBeforeGrant - Validation callback that runs before grant is confirmed.
   * @returns The confirmation dialog instance.
   */
  createConfirmation({
    dialogInterface,
    ui,
    onBeforeGrant,
  }: {
    dialogInterface: DialogInterface;
    ui: SnapElement;
    onBeforeGrant: () => Promise<boolean>;
  }): ConfirmationDialog {
    return new ConfirmationDialog({
      dialogInterface,
      ui,
      userEventDispatcher: this.#userEventDispatcher,
      onBeforeGrant,
      timeoutFactory: this.#timeoutFactory,
    });
  }
}
