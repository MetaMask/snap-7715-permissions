import {
  ConfirmationFooter,
  GRANT_BUTTON,
  CANCEL_BUTTON,
} from '../../ui/components/ConfirmationFooter';
import { RequestHeader } from '../../ui/components/RequestHeader';
import { ShowMoreText } from '../../ui/components/ShowMoreText';
import { TooltipIcon } from '../../ui/components/TooltipIcon';
import {
  Box,
  Container,
  GenericSnapElement,
  Section,
  Text,
  Image,
} from '@metamask/snaps-sdk/jsx';
import { SnapsProvider, UserInputEventType } from '@metamask/snaps-sdk';
import {
  UserEventDispatcher,
  UserEventHandler,
} from '../../userEventDispatcher';
import { AdditionalField } from '../types';
import { ConfirmationProps } from '../types';

export class ConfirmationDialog {
  readonly #snaps: SnapsProvider;
  readonly #userEventDispatcher: UserEventDispatcher;
  readonly #title: string;
  readonly #justification: string;
  readonly #origin: string;
  readonly #network: string;
  readonly #additionalFields: AdditionalField[];

  #isJustificationCollapsed: boolean = true;
  #ui: GenericSnapElement;
  #interfaceId: string | undefined;

  constructor({
    title,
    justification,
    origin,
    network,
    ui,
    snaps,
    userEventDispatcher,
    additionalFields = [],
  }: ConfirmationProps) {
    this.#title = title;
    this.#origin = origin;
    this.#network = network;
    this.#justification = justification;
    this.#ui = ui;
    this.#snaps = snaps;
    this.#userEventDispatcher = userEventDispatcher;
    this.#additionalFields = additionalFields;
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
    const fields: AdditionalField[] = [
      {
        label: 'Recipient',
        value: this.#origin,
        tooltip: 'The site requesting the permission',
      },
      {
        label: 'Network',
        value: this.#network,
        tooltip: 'The network on which the permission is being requested',
      },
      ...this.#additionalFields,
    ];

    const requestDetailsFields = fields.map(
      ({ label, value, iconUrl, tooltip }) => {
        const iconElement = iconUrl ? (
          <Image src={iconUrl} alt={value} />
        ) : null;

        const tooltipElement = tooltip ? (
          <TooltipIcon tooltip={tooltip} />
        ) : null;

        return (
          <Box direction="horizontal" alignment="space-between">
            <Box direction="horizontal">
              <Text>{label}</Text>
              {tooltipElement}
            </Box>
            <Box direction="horizontal">
              {iconElement}
              <Text>{value}</Text>
            </Box>
          </Box>
        );
      },
    );
    return (
      <Container>
        <Box>
          <RequestHeader title={this.#title} />
          <Section>
            {requestDetailsFields}
            <Box direction="horizontal" alignment="space-between">
              <Box direction="horizontal">
                <Text>Reason</Text>
                <TooltipIcon tooltip="Reason given by the recipient for requesting this token stream allowance." />
              </Box>
              <Box direction="horizontal">
                <ShowMoreText
                  text={this.#justification}
                  buttonName="show-more-button"
                  isCollapsed={this.#isJustificationCollapsed}
                />
              </Box>
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
