import type { SnapsProvider } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';
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
      throw new Error(ConfirmationDialog.#interfaceNotCreatedError);
    }
    const interfaceId = this.#interfaceId;

    const isConfirmationGranted = new Promise<boolean>((resolve, reject) => {
      // cleanup can't be defined before the click handlers, so cannot be const
      // eslint-disable-next-line prefer-const
      let cleanup: () => Promise<void>;

      const { unbind: unbindGrantButtonClick } = this.#userEventDispatcher.on({
        elementName: ConfirmationDialog.#grantButton,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: async () => {
          await cleanup();

          resolve(true);
        },
      });

      const { unbind: unbindCancelButtonClick } = this.#userEventDispatcher.on({
        elementName: ConfirmationDialog.#cancelButton,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: async () => {
          await cleanup();

          resolve(false);
        },
      });

      cleanup = async () => {
        unbindGrantButtonClick();
        unbindCancelButtonClick();

        try {
          await this.#snaps.request({
            method: 'snap_resolveInterface',
            params: {
              id: interfaceId,
              value: {},
            },
          });
        } catch (error) {
          const reason = error as Error;
          reject(reason);
        }
      };

      // we don't await this, because we only want to present the dialog, and
      // not wait for it to be resolved
      this.#snaps
        .request({
          method: 'snap_dialog',
          params: {
            id: interfaceId,
          },
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
      throw new Error(ConfirmationDialog.#interfaceNotCreatedError);
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
}
