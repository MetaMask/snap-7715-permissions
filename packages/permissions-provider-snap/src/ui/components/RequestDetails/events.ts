import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  ButtonClickEvent,
  InterfaceContext,
  UserInputEventType,
} from '@metamask/snaps-sdk';

import type { UserEventHandler } from '../../../userEventDispatcher';
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
  logger.debug(
    `Handling onShowMoreButtonClick event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

export const requestDetailsEventHandlers = {
  [RequestDetailsEventNames.ShowMoreButton]: onShowMoreButtonClick,
};
