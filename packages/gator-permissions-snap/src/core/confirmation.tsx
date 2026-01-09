import { UserInputEventType } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Button, Container, Footer } from '@metamask/snaps-sdk/jsx';

import type { DialogInterface } from './dialogInterface';
import type { UserEventDispatcher } from '../userEventDispatcher';
import type { Timeout, TimeoutFactory } from './timeoutFactory';
import type { ConfirmationProps } from './types';
import { t } from '../utils/i18n';

export class ConfirmationDialog {
  static #cancelButton = 'cancel-button';

  static #grantButton = 'grant-button';

  readonly #dialogInterface: DialogInterface;

  readonly #userEventDispatcher: UserEventDispatcher;

  readonly #timeoutFactory: TimeoutFactory;

  #ui: SnapElement;

  #isGrantDisabled = true;

  #timeout: Timeout | undefined;

  #hasTimedOut = false;

  // Track handlers and promise hooks so we can programmatically close the dialog on error
  #unbindHandlers: (() => void) | undefined;

  #decisionReject: ((reason: Error) => void) | undefined;

  #decisionResolve: ((value: boolean) => void) | undefined;

  readonly #onBeforeGrant: () => Promise<boolean>;

  constructor({
    dialogInterface,
    ui,
    userEventDispatcher,
    onBeforeGrant,
    timeoutFactory,
  }: ConfirmationProps) {
    this.#dialogInterface = dialogInterface;
    this.#ui = ui;
    this.#userEventDispatcher = userEventDispatcher;
    this.#onBeforeGrant = onBeforeGrant;
    this.#timeoutFactory = timeoutFactory;
  }

  /**
   * Initializes the confirmation dialog by showing content via DialogInterface.
   * This will create or update the interface, and show the dialog if not already shown.
   * @returns The interface ID.
   */
  async initialize(): Promise<string> {
    return this.#dialogInterface.show(this.#buildConfirmation(), () =>
      this.#handleDialogClose(),
    );
  }

  /**
   * Handles dialog close event (user clicked X button).
   * DialogInterface already handles the actual dialog closing.
   */
  #handleDialogClose(): void {
    // Cancel timeout and unbind handlers (dialog is already closing)
    this.#cleanupHandlers();
    if (this.#decisionResolve) {
      this.#decisionResolve(false);
      this.#decisionResolve = undefined;
    }
  }

  /**
   * Waits for the user to grant or cancel the confirmation.
   * @returns Object with isConfirmationGranted boolean.
   */
  async displayConfirmationDialogAndAwaitUserDecision(): Promise<{
    isConfirmationGranted: boolean;
  }> {
    const { interfaceId } = this.#dialogInterface;
    if (!interfaceId) {
      throw new Error('Interface not yet created. Call initialize() first.');
    }

    const isConfirmationGranted = new Promise<boolean>((resolve, reject) => {
      this.#decisionResolve = resolve;
      this.#decisionReject = reject;

      const cleanupAndResolveIfNotTimedOut = async (decision: boolean) => {
        if (!this.#hasTimedOut) {
          this.#cleanupHandlers();
          await this.#dialogInterface.close();
        }

        if (!this.#hasTimedOut) {
          resolve(decision);
        }
      };

      this.#timeout = this.#timeoutFactory.register({
        onTimeout: async () => {
          this.#hasTimedOut = true;

          this.#cleanupHandlers();
          await this.#dialogInterface.close();

          reject(new Error('Timeout waiting for user decision'));
        },
      });

      const { unbind: unbindGrantButtonClick } = this.#userEventDispatcher.on({
        elementName: ConfirmationDialog.#grantButton,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: async () => {
          /**
           * Button click events are non-debounced and trigger immediately. However, when a non-debounced event
           * fires, all pending debounced events (like input changes) are processed first. This ensures that
           * if a user modifies a field and immediately clicks grant, the input change handler completes before
           * this click handler executes, keeping state up-to-date. But the button is already triggered so
           * onBeforeGrant is here to prevent button click execution if validation fails.
           */
          const isValid = await this.#onBeforeGrant();
          // If validation fails, don't resolve - keep dialog open with errors shown
          if (!isValid) {
            return;
          }

          await cleanupAndResolveIfNotTimedOut(true);
        },
      });

      const { unbind: unbindCancelButtonClick } = this.#userEventDispatcher.on({
        elementName: ConfirmationDialog.#cancelButton,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: async () => {
          await cleanupAndResolveIfNotTimedOut(false);
        },
      });

      // store hooks so we can close/reject programmatically on error
      this.#unbindHandlers = () => {
        unbindGrantButtonClick();
        unbindCancelButtonClick();
      };
    });

    return {
      isConfirmationGranted: await isConfirmationGranted,
    };
  }

  /**
   * Clean up timeout and event handlers.
   * Does not close the dialog interface - caller should handle that separately if needed.
   */
  #cleanupHandlers(): void {
    this.#timeout?.cancel();
    // although not strictly necessary, we clear the timeout handler to avoid unnecessarily calling cancel() multiple times
    this.#timeout = undefined;

    // Unbind any listeners to avoid leaks
    if (this.#unbindHandlers) {
      try {
        this.#unbindHandlers();
      } catch {
        // ignore
      } finally {
        // we should only call the unbindHandlers once
        this.#unbindHandlers = undefined;
      }
    }
  }

  #buildConfirmation(): JSX.Element {
    return (
      <Container>
        {this.#ui}
        <Footer>
          <Button name={ConfirmationDialog.#cancelButton} variant="destructive">
            {t('cancelButton')}
          </Button>
          <Button
            name={ConfirmationDialog.#grantButton}
            variant="primary"
            disabled={this.#isGrantDisabled}
          >
            {t('grantButton')}
          </Button>
        </Footer>
      </Container>
    );
  }

  /**
   * Updates the confirmation dialog content.
   * @param options - The update options.
   * @param options.ui - The new UI content.
   * @param options.isGrantDisabled - Whether the grant button should be disabled.
   */
  async updateContent({
    ui,
    isGrantDisabled,
  }: {
    ui: SnapElement;
    isGrantDisabled: boolean;
  }): Promise<void> {
    this.#ui = ui;
    this.#isGrantDisabled = isGrantDisabled;

    await this.#dialogInterface.show(this.#buildConfirmation());
  }

  /**
   * Programmatically close the confirmation dialog due to an error and reject the pending decision promise.
   * Safe to call multiple times.
   * @param reason - The error to reject the pending decision promise with.
   */
  async closeWithError(reason: Error): Promise<void> {
    // Clean up timeout and handlers
    this.#cleanupHandlers();

    // Close the dialog interface
    await this.#dialogInterface.close();

    if (this.#decisionReject) {
      this.#decisionReject(reason);
      this.#decisionReject = undefined;
    }
  }
}
