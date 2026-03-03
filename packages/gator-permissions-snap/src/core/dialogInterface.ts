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
          return result;
        })
        .catch(() => {
          // Dialog closed with error, treat as user cancel
          this.#onDialogClose?.();
        });
    }

    return this.#interfaceId;
  }

  /**
   * Tries to close the dialog interface.
   * @param interfaceId - The ID of the interface to attempt to close.
   * @returns boolean indicating whether the attempt was successful.
   */
  async #tryToClose(interfaceId: string): Promise<boolean> {
    try {
      await this.#snap.request({
        method: 'snap_resolveInterface',
        params: { id: interfaceId, value: {} },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether the specified interface exists.
   * @param interfaceId - The ID of the interface to check.
   * @returns boolean indicating whether the interface exists.
   */
  async #doesInterfaceExist(interfaceId: string): Promise<boolean> {
    try {
      await this.#snap.request({
        method: 'snap_getInterfaceContext',
        params: { id: interfaceId },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Programmatically close the dialog.
   * Safe to call multiple times.
   * Best effort: attempts up to three close requests; always clears local state and resolves.
   * Callers in confirmation.tsx do not catch errors, so this method does not throw.
   */
  async close(): Promise<void> {
    const MAX_ATTEMPTS = 3;

    const cleanup = (): void => {
      this.#interfaceId = undefined;
      this.#isDialogShown = false;
    };

    if (!this.#interfaceId) {
      return;
    }

    const id = this.#interfaceId;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (await this.#tryToClose(id)) {
        cleanup();
        return;
      }

      if (!(await this.#doesInterfaceExist(id))) {
        cleanup();
        return;
      }
    }

    cleanup();
  }

  /**
   * Gets the current interface ID, if created.
   * @returns The interface ID or undefined if not created.
   */
  get interfaceId(): string | undefined {
    return this.#interfaceId;
  }
}
