import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';

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
   * @param params.onBeforeGrant - Validation callback that runs before grant is confirmed.
   * @param params.existingInterfaceId - Optional existing interface ID to reuse.
   * @returns A promise that resolves with the confirmation dialog.
   */
  createConfirmation({
    ui,
    isGrantDisabled,
    onBeforeGrant,
    existingInterfaceId,
  }: {
    ui: SnapElement;
    isGrantDisabled: boolean;
    onBeforeGrant: () => Promise<boolean>;
    existingInterfaceId?: string;
  }) {
    const baseProps = {
      ui,
      isGrantDisabled,
      snaps: this.#snap,
      userEventDispatcher: this.#userEventDispatcher,
      onBeforeGrant,
    };

    // If we have an existing interface, the dialog is already shown (e.g., from intro screen)
    return new ConfirmationDialog(
      existingInterfaceId === undefined
        ? baseProps
        : { ...baseProps, existingInterfaceId, isDialogAlreadyShown: true },
    );
  }
}
