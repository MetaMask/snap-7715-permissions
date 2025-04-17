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
type ConfirmationProps<TContext extends BaseContext> = {
  title: string;
  justification: string;
  context: TContext;
  ui: GenericSnapElement;
  snaps: SnapsProvider;
  userEventDispatcher: UserEventDispatcher;
};

export type ConfirmationLifecycleCallback<TContext extends BaseContext> =
  (args: { dialog: ConfirmationDialog<TContext>; elementId: string }) => void;

/**
 * Confirmation dialog implementation that provides standard layout and behavior.
 */
export class ConfirmationDialog<TContext extends BaseContext> {
  readonly #snaps: SnapsProvider;
  readonly #userEventDispatcher: UserEventDispatcher;
  readonly #title: string;
  readonly #justification: string;

  #isJustificationCollapsed: boolean = true;
  #ui: GenericSnapElement;
  #context: TContext;
  #interfaceId: string | undefined;

  constructor({
    title,
    justification,
    context,
    ui,
    snaps,
    userEventDispatcher,
  }: ConfirmationProps<TContext>) {
    this.#title = title;
    this.#justification = justification;
    this.#context = context;
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
        context: this.#context,
        ui: this.buildConfirmation(),
      },
    });

    return this.#interfaceId;
  }

  async awaitUserDecision(): Promise<{
    isConfirmationGranted: boolean;
    grantedContext: TContext;
  }> {
    if (!this.#interfaceId) {
      throw new Error('Interface not yet created. Call createInterface first.');
    }
    const interfaceId = this.#interfaceId;

    const isConfirmationGranted = new Promise<boolean>((resolve, reject) => {
      const onButtonClick: UserEventHandler<
        UserInputEventType.ButtonClickEvent
      > = ({ event }) => {
        let isGranted = false;

        switch (event.name) {
          case GRANT_BUTTON:
            isGranted = true;
            break;
          case CANCEL_BUTTON:
            isGranted = false;
            break;

          default:
            throw new Error(
              `Unexpected event name. Expected ${GRANT_BUTTON} or ${CANCEL_BUTTON}.`,
            );
        }

        this.#userEventDispatcher.off({
          elementName: GRANT_BUTTON,
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler: onButtonClick,
        });

        this.#userEventDispatcher.off({
          elementName: CANCEL_BUTTON,
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler: onButtonClick,
        });

        this.#userEventDispatcher.off({
          elementName: 'show-more-button',
          eventType: UserInputEventType.ButtonClickEvent,
          interfaceId,
          handler: onShowMoreButtonClickHandler,
        });

        this.#snaps
          .request({
            method: 'snap_resolveInterface',
            params: {
              id: interfaceId,
              value: {},
            },
          })
          .catch((error) => {
            const reason = error as Error;
            reject(reason);
          });

        resolve(isGranted);
      };

      this.#userEventDispatcher.on({
        elementName: GRANT_BUTTON,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: onButtonClick,
      });

      this.#userEventDispatcher.on({
        elementName: CANCEL_BUTTON,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: onButtonClick,
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
      grantedContext: this.#context,
    };
  }

  private toggleShowMoreText() {
    this.#isJustificationCollapsed = !this.#isJustificationCollapsed;

    this.updateContent({ ui: this.#ui, context: this.#context });
  }

  private buildConfirmation(): JSX.Element {
    const ui = this.#ui;

    // todo: maybe make request details iterable?
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
          {ui}
        </Box>
        <ConfirmationFooter />
      </Container>
    );
  }

  async updateContent({
    ui,
    context,
  }: {
    ui: GenericSnapElement;
    context: TContext;
  }): Promise<void> {
    if (!this.#interfaceId) {
      throw new Error('Cannot update content before dialog is created');
    }

    this.#ui = ui;
    this.#context = context;

    await this.#snaps.request({
      method: 'snap_updateInterface',
      params: {
        id: this.#interfaceId,
        context: this.#context,
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
