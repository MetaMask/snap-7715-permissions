import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';

import type { UserEventDispatcher } from '../userEventDispatcher';
import { ConfirmationDialog } from './confirmation';
import type { AdditionalField } from './types';

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
   * @param params.title - The title text to display in the confirmation dialog.
   * @param params.justification - The justification text explaining the reason for the confirmation.
   * @param params.ui - The UI elements to be displayed in the confirmation dialog.
   * @param params.origin - The origin of the request requiring confirmation.
   * @param params.network - The network context for the confirmation.
   * @param params.additionalFields - Optional additional fields to be included in the confirmation dialog.
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
