import type { SnapsProvider } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { Container } from '@metamask/snaps-sdk/jsx';

import {
  ConfirmationFooter,
  GRANT_BUTTON,
  CANCEL_BUTTON,
} from '../ui/components/ConfirmationFooter';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../userEventDispatcher';
import type { ConfirmationProps } from './types';

export class ConfirmationDialog {
  readonly #snaps: SnapsProvider;

  readonly #userEventDispatcher: UserEventDispatcher;

  #ui: GenericSnapElement;

  #interfaceId: string | undefined;

  constructor({ ui, snaps, userEventDispatcher }: ConfirmationProps) {
    this.#ui = ui;
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

  async awaitUserDecision(): Promise<{
    isConfirmationGranted: boolean;
  }> {
    if (!this.#interfaceId) {
      throw new Error('Interface not yet created. Call createInterface first.');
    }
    const interfaceId = this.#interfaceId;

    const isConfirmationGranted = new Promise<boolean>((resolve, reject) => {
      // cleanup can't be defined before the click handlers, so cannot be const
      // eslint-disable-next-line prefer-const
      let cleanup: () => Promise<void>;

      const onGrantButtonClick: UserEventHandler<
        UserInputEventType.ButtonClickEvent
      > = async () => {
        await cleanup();

        resolve(true);
      };

      const onCancelButtonClick: UserEventHandler<
        UserInputEventType.ButtonClickEvent
      > = async () => {
        await cleanup();

        resolve(false);
      };

      cleanup = async () => {
        this.#userEventDispatcher.off({
          elementName: GRANT_BUTTON,
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler: onGrantButtonClick,
        });

        this.#userEventDispatcher.off({
          elementName: CANCEL_BUTTON,
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler: onCancelButtonClick,
        });

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

      this.#userEventDispatcher.on({
        elementName: GRANT_BUTTON,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: onGrantButtonClick,
      });

      this.#userEventDispatcher.on({
        elementName: CANCEL_BUTTON,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: onCancelButtonClick,
      });

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
        <ConfirmationFooter />
      </Container>
    );
  }

  async updateContent({ ui }: { ui: GenericSnapElement }): Promise<void> {
    if (!this.#interfaceId) {
      throw new Error('Cannot update content before dialog is created');
    }

    this.#ui = ui;

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
