import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  ButtonClickEvent,
  InterfaceContext,
  UserInputEventType,
} from '@metamask/snaps-sdk';

import type { UserEventHandler } from '../../../userEventDispatcher';
import { StreamAmountEventNames } from './StreamAmount';

/**
 * Handles the event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onStreamAmountClick: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({
  event,
  context,
}: {
  event: ButtonClickEvent;
  context: InterfaceContext | null;
}) => {
  logger.debug(
    `Handling onStreamAmountClick event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
};

/**
 * Handles the event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onPeriodClick: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({
  event,
  context,
}: {
  event: ButtonClickEvent;
  context: InterfaceContext | null;
}) => {
  logger.debug(
    `Handling onPeriodClick event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
};

export const streamAmountEventHandlers = {
  [StreamAmountEventNames.StreamAmount]: onStreamAmountClick,
  [StreamAmountEventNames.Period]: onPeriodClick,
};
