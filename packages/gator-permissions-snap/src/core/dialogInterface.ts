import type { SnapsProvider } from '@metamask/snaps-sdk';

/**
 * Manages the lifecycle of a dialog interface.
 * Centralizes interface creation, updates, and dialog display.
 * Services use this to show content without worrying about whether
 * the interface needs to be created or updated.
 */
export class DialogInterface {
  readonly #snap: SnapsProvider;

  #interfaceId: string | undefined;

  #isDialogShown = false;

  #onDialogClose: (() => void) | undefined;

  constructor(snap: SnapsProvider) {
    this.#snap = snap;
  }

  /**
   * Shows content in the dialog interface.
   * Creates interface on first call, updates on subsequent calls.
   * Shows dialog on first call, no-ops on subsequent calls.
   * Registers close handler if provided (latest handler wins).
   * @param ui - The UI content to display.
   * @param onClose - Optional callback when dialog is closed by user (X button).
   * @returns The interface ID.
   */
  async show(ui: JSX.Element, onClose?: () => void): Promise<string> {
    if (this.#interfaceId) {
      await this.#snap.request({
        method: 'snap_updateInterface',
        params: { id: this.#interfaceId, ui, context: {} },
      });
    } else {
      this.#interfaceId = await this.#snap.request({
        method: 'snap_createInterface',
        params: { ui, context: {} },
      });
    }

    if (onClose) {
      this.#onDialogClose = onClose;
    }

    if (!this.#isDialogShown) {
      this.#isDialogShown = true;
      this.#snap
        .request({ method: 'snap_dialog', params: { id: this.#interfaceId } })
        .then((result) => {
          if (result === null) {
            this.#onDialogClose?.();
          }
        })
        .catch(() => {
          // Dialog closed with error, treat as user cancel
          this.#onDialogClose?.();
        });
    }

    return this.#interfaceId;
  }

  /**
   * Programmatically close the dialog.
   * Safe to call multiple times.
   */
  async close(): Promise<void> {
    if (this.#interfaceId) {
      try {
        await this.#snap.request({
          method: 'snap_resolveInterface',
          params: { id: this.#interfaceId, value: {} },
        });
      } catch {
        // Silently ignore - dialog may already be closed
      }
      this.#interfaceId = undefined;
      this.#isDialogShown = false;
    }
  }

  /**
   * Gets the current interface ID, if created.
   * @returns The interface ID or undefined if not created.
   */
  get interfaceId(): string | undefined {
    return this.#interfaceId;
  }
}
