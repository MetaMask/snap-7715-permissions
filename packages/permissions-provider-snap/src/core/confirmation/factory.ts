import type { SnapsProvider } from '@metamask/snaps-sdk';
import type { BaseContext } from '../types';
import { UserEventDispatcher } from '../../userEventDispatcher';
import {
  ConfirmationDialog,
  ConfirmationLifecycleCallback,
} from './confirmation';
import { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
/**
 * Interface for a confirmation dialog that can be presented to the user.
 */
export type ConfirmationDialogType<TContext extends BaseContext> = {
  /**
   * Awaits the user's decision on the confirmation dialog.
   * @returns A promise that resolves with the user's decision and any context modifications.
   */
  awaitUserDecision(): Promise<{
    isConfirmationGranted: boolean;
    grantedContext: TContext;
  }>;

  /**
   * Updates the content of the confirmation dialog.
   * @param content - The new content to display.
   */
  updateContent(args: { ui: any; context: TContext }): void;

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
  createConfirmation<TContext extends BaseContext>({
    title,
    ui,
    context,
    justification,
  }: {
    title: string;
    justification: string;
    ui: GenericSnapElement;
    context: TContext;
  }): ConfirmationDialogType<TContext> {
    return new ConfirmationDialog({
      title,
      ui,
      context,
      justification,
      snaps: this.#snap,
      userEventDispatcher: this.#userEventDispatcher,
    });
  }
}
