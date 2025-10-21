import type { SnapsProvider } from '@metamask/snaps-sdk';
import { MethodNotFoundError, UserInputEventType } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Button, Container, Footer } from '@metamask/snaps-sdk/jsx';

import type { UserEventDispatcher } from '../userEventDispatcher';
import type { ConfirmationProps } from './types';

export class ConfirmationDialog {
  static #cancelButton = 'cancel-button';

  static #grantButton = 'grant-button';

  static #interfaceNotCreatedError =
    'Interface not yet created. Call createInterface() first.';

  readonly #snaps: SnapsProvider;

  readonly #userEventDispatcher: UserEventDispatcher;

  #ui: SnapElement;

  #interfaceId: string | undefined;

  #isGrantDisabled: boolean;

  // Track handlers and promise hooks so we can programmatically close the dialog on error
  #unbindHandlers: (() => void) | undefined;

  #decisionReject: ((reason: Error) => void) | undefined;

  constructor({
    ui,
    isGrantDisabled,
    snaps,
    userEventDispatcher,
  }: ConfirmationProps) {
    this.#ui = ui;
    this.#isGrantDisabled = isGrantDisabled;
    this.#snaps = snaps;
    this.#userEventDispatcher = userEventDispatcher;
  }

  async createInterface(): Promise<string> {
    if (this.#interfaceId) {
      return this.#interfaceId;
    }

    this.#interfaceId = await this.#snaps.request({
      method: 'snap_createInterface',
      params: {
        context: {},
        ui: this.#buildConfirmation(),
      },
    });

    return this.#interfaceId;
  }

  async displayConfirmationDialogAndAwaitUserDecision(): Promise<{
    isConfirmationGranted: boolean;
  }> {
    if (!this.#interfaceId) {
      throw new MethodNotFoundError(
        ConfirmationDialog.#interfaceNotCreatedError,
      );
    }
    const interfaceId = this.#interfaceId;

    const isConfirmationGranted = new Promise<boolean>((resolve, reject) => {
      const { unbind: unbindGrantButtonClick } = this.#userEventDispatcher.on({
        elementName: ConfirmationDialog.#grantButton,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: async () => {
          await this.#cleanup();

          resolve(true);
        },
      });

      const { unbind: unbindCancelButtonClick } = this.#userEventDispatcher.on({
        elementName: ConfirmationDialog.#cancelButton,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: async () => {
          await this.#cleanup();

          resolve(false);
        },
      });

      // store hooks so we can close/reject programmatically on error
      this.#unbindHandlers = () => {
        unbindGrantButtonClick();
        unbindCancelButtonClick();
      };

      this.#decisionReject = reject;

      // we don't await this, because we only want to present the dialog, and
      // not wait for it to be resolved
      this.#snaps
        .request({
          method: 'snap_dialog',
          params: {
            id: interfaceId,
          },
        })
        .then(async (result) => {
          // Should resolve with false when dialog is closed.
          if (result === null) {
            await this.#cleanup(false);

            resolve(false);
          }
        })
        .catch((error) => {
          const reason = error as Error;
          reject(reason);
        });
    });

    return {
      isConfirmationGranted: await isConfirmationGranted,
    };
  }

  /**
   * Clean up event handlers and optionally resolve the interface.
   * @param resolveInterface - Whether to resolve the interface. Defaults to true.
   */
  async #cleanup(resolveInterface = true): Promise<void> {
    // Unbind any listeners to avoid leaks
    if (this.#unbindHandlers) {
      try {
        this.#unbindHandlers();
      } catch {
        // ignore
      } finally {
        this.#unbindHandlers = undefined;
      }
    }

    if (resolveInterface && this.#interfaceId) {
      try {
        await this.#snaps.request({
          method: 'snap_resolveInterface',
          params: {
            id: this.#interfaceId,
            value: {},
          },
        });
      } catch (error) {
        // If resolving fails during cleanup, we still want to continue
        // The error will be caught by the caller if needed
      }
    }
  }

  #buildConfirmation(): JSX.Element {
    return (
      <Container>
        {this.#ui}
        <Footer>
          <Button name={ConfirmationDialog.#cancelButton} variant="destructive">
            Cancel
          </Button>
          <Button
            name={ConfirmationDialog.#grantButton}
            variant="primary"
            disabled={this.#isGrantDisabled}
          >
            Grant
          </Button>
        </Footer>
      </Container>
    );
  }

  async updateContent({
    ui,
    isGrantDisabled,
  }: {
    ui: SnapElement;
    isGrantDisabled: boolean;
  }): Promise<void> {
    if (!this.#interfaceId) {
      throw new MethodNotFoundError(
        ConfirmationDialog.#interfaceNotCreatedError,
      );
    }

    this.#ui = ui;
    this.#isGrantDisabled = isGrantDisabled;

    await this.#snaps.request({
      method: 'snap_updateInterface',
      params: {
        id: this.#interfaceId,
        context: {},
        ui: this.#buildConfirmation(),
      },
    });
  }

  /**
   * Programmatically close the confirmation dialog due to an error and reject the pending decision promise.
   * Safe to call multiple times.
   * @param reason - The error to reject the pending decision promise with.
   */
  async closeWithError(reason: Error): Promise<void> {
    if (!this.#interfaceId) {
      // nothing to close
      if (this.#decisionReject) {
        this.#decisionReject(reason);
        this.#decisionReject = undefined;
      }
      return;
    }

    // Clean up handlers and resolve interface
    await this.#cleanup(true);

    // Clear interface ID after cleanup
    this.#interfaceId = undefined;

    if (this.#decisionReject) {
      this.#decisionReject(reason);
      this.#decisionReject = undefined;
    }
  }
}
