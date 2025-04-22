import {
  ConfirmationFooter,
  GRANT_BUTTON,
  CANCEL_BUTTON,
} from '../../ui/components/confirmation-footer';
import { RequestHeader } from '../../ui/components/RequestHeader';
import { type BaseContext } from '../types';
import {
  Box,
  Button,
  Container,
  GenericSnapElement,
  Section,
  Text,
} from '@metamask/snaps-sdk/jsx';
import { SnapsProvider, UserInputEventType } from '@metamask/snaps-sdk';
import {
  UserEventDispatcher,
  UserEventHandler,
} from '../../userEventDispatcher';

/**
 * Props for building the confirmation dialog UI.
 */
type ConfirmationProps = {
  title: string;
  justification: string;
  ui: GenericSnapElement;
  snaps: SnapsProvider;
  userEventDispatcher: UserEventDispatcher;
};

export type ConfirmationLifecycleCallback = (args: {
  dialog: ConfirmationDialog;
  elementId: string;
}) => void;

/**
 * Confirmation dialog implementation that provides standard layout and behavior.
 */
export class ConfirmationDialog {
  readonly #snaps: SnapsProvider;
  readonly #userEventDispatcher: UserEventDispatcher;
  readonly #title: string;
  readonly #justification: string;

  #isJustificationCollapsed: boolean = true;
  #ui: GenericSnapElement;
  #interfaceId: string | undefined;

  constructor({
    title,
    justification,
    ui,
    snaps,
    userEventDispatcher,
  }: ConfirmationProps) {
    this.#title = title;
    this.#justification = justification;
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
        ui: this.buildConfirmation(),
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
      const cleanup = async () => {
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

        this.#userEventDispatcher.off({
          elementName: 'show-more-button',
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler: onShowMoreButtonClickHandler,
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
          reject(error as Error);
        }
      };

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

      const onShowMoreButtonClickHandler = () => {
        this.toggleShowMoreText();
      };

      this.#userEventDispatcher.on({
        elementName: 'show-more-button',
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: onShowMoreButtonClickHandler,
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

  private toggleShowMoreText() {
    this.#isJustificationCollapsed = !this.#isJustificationCollapsed;

    this.updateContent({ ui: this.#ui });
  }

  private buildConfirmation(): JSX.Element {
    // todo: make request details iterable, so that the caller can specify what is displayed
    return (
      <Container>
        <Box>
          <RequestHeader title={this.#title} />
          <Section>
            <Box direction="horizontal" alignment="space-between">
              <Text>Recipient</Text>
              <Text>Steve</Text>
            </Box>
            <Box direction="horizontal" alignment="space-between">
              <Text>Network</Text>
              <Text>Ethereum</Text>
            </Box>
            <Box direction="horizontal" alignment="space-between">
              <Text>Token</Text>
              <Text>ETH</Text>
            </Box>
            <Box direction="horizontal" alignment="space-between">
              <Text>Reason</Text>
              <ShowMoreText
                text={this.#justification}
                buttonName="show-more-button"
                isCollapsed={this.#isJustificationCollapsed}
              />
            </Box>
          </Section>
          {this.#ui}
        </Box>
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
        ui: this.buildConfirmation(),
      },
    });
  }
}

//todo: move to ui components
const ShowMoreText = ({
  text,
  buttonName,
  isCollapsed,
}: {
  text: string;
  buttonName: string;
  isCollapsed: boolean;
}) => {
  const displayText =
    text.length > 12 && isCollapsed ? `${text.slice(0, 12)}...` : text;
  const buttonText = isCollapsed ? 'Show' : 'Hide';

  return (
    <Box direction={isCollapsed ? 'horizontal' : 'vertical'}>
      <Text color="muted">{displayText}</Text>
      <Button name={buttonName}>{buttonText}</Button>
    </Box>
  );
};
