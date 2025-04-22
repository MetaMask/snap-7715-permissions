import type { SnapsProvider } from '@metamask/snaps-sdk';
import { UserEventDispatcher } from '../../userEventDispatcher';
import { ConfirmationDialog } from './confirmation';
import { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
/**
 * Interface for a confirmation dialog that can be presented to the user.
 */
export type ConfirmationDialogType = {
  /**
   * Awaits the user's decision on the confirmation dialog.
   * @returns A promise that resolves with the user's decision.
   */
  awaitUserDecision(): Promise<{
    isConfirmationGranted: boolean;
  }>;

  /**
   * Updates the content of the confirmation dialog.
   * @param content - The new content to display.
   */
  updateContent(args: { ui: any }): void;

  createInterface(): Promise<string>;
};

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
   * @param title - The title of the confirmation dialog.
   * @param content - The content to display in the dialog.
   * @param onCreate - Callback when the dialog is created.
   * @param onDestroy - Callback when the dialog is destroyed.
   * @returns A promise that resolves with the confirmation dialog.
   */
  createConfirmation({
    title,
    ui,
    justification,
  }: {
    title: string;
    justification: string;
    ui: GenericSnapElement;
  }): ConfirmationDialogType {
    return new ConfirmationDialog({
      title,
      ui,
      justification,
      snaps: this.#snap,
      userEventDispatcher: this.#userEventDispatcher,
    });
  }
}
