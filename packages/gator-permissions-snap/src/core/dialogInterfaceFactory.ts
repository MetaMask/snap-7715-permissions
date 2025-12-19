import type { SnapsProvider } from '@metamask/snaps-sdk';

import { DialogInterface } from './dialogInterface';

/**
 * Factory for creating dialog interface instances.
 */
export class DialogInterfaceFactory {
  readonly #snap: SnapsProvider;

  constructor({ snap }: { snap: SnapsProvider }) {
    this.#snap = snap;
  }

  /**
   * Creates a new dialog interface instance.
   * @returns A new DialogInterface instance.
   */
  createDialogInterface(): DialogInterface {
    return new DialogInterface(this.#snap);
  }
}
