import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';

import type { UserEventDispatcher } from '../userEventDispatcher';
import type { AdditionalField } from './types';
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
   * @param title.title - The title text to display in the confirmation dialog.
   * @param title.justification - The justification text explaining the reason for the confirmation.
   * @param title.ui - The UI elements to be displayed in the confirmation dialog.
   * @param title.origin - The origin of the request requiring confirmation.
   * @param title.network - The network context for the confirmation.
   * @param title.additionalFields - Optional additional fields to be included in the confirmation dialog.
   * @param onCreate - Callback when the dialog is created.
   * @param onDestroy - Callback when the dialog is destroyed.
   * @returns A promise that resolves with the confirmation dialog.
   */
  createConfirmation({
    title,
    ui,
    justification,
    origin,
    network,
    additionalFields = [],
  }: {
    title: string;
    justification: string;
    ui: GenericSnapElement;
    origin: string;
    network: string;
    additionalFields?: AdditionalField[];
  }) {
    return new ConfirmationDialog({
      title,
      ui,
      justification,
      origin,
      network,
      snaps: this.#snap,
      userEventDispatcher: this.#userEventDispatcher,
      additionalFields,
    });
  }
}
