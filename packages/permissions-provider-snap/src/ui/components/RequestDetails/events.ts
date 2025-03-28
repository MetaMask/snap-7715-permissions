import { logger } from '@metamask/7715-permissions-shared/utils';
import type { ButtonClickEvent, InterfaceContext } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type { UserEventHandler } from '../../../userEventDispatcher';
import type { DialogContentEventHandlers } from '../../handler';
import { RequestDetailsEventNames } from './RequestDetails';

/**
 * Handles the "Show More" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onShowMoreButtonClick: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({
  event,
  context,
}: {
  event: ButtonClickEvent;
  context: InterfaceContext | null;
}) => {
  const eventName = event.name;
  if (!eventName) {
    return;
  }
  if (!(eventName === RequestDetailsEventNames.ShowMoreButton)) {
    return;
  }
  // TODO: Add the event handle logic to make the button interactive
  logger.debug(
    `Handling onShowMoreButtonClick event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
};

export const requestDetailsButtonEventHandlers: DialogContentEventHandlers[] = [
  {
    eventType: UserInputEventType.ButtonClickEvent,
    handler: onShowMoreButtonClick as UserEventHandler<UserInputEventType>,
  },
];
