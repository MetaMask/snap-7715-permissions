import { logger } from '@metamask/7715-permissions-shared/utils';
import type { UserInputEventType } from '@metamask/snaps-sdk';

import type { UserEventHandler } from '../../../userEventDispatcher';

/**
 * Handles the "Show More" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const onShowMoreButtonClick: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({ event, attenuatedContext }) => {
  logger.debug(
    `Handling onShowMoreButtonClick event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  const eventName = event.name ?? '';
  const foundStateItem = attenuatedContext.state[eventName];

  return foundStateItem === undefined
    ? attenuatedContext
    : {
        ...attenuatedContext,
        state: {
          ...attenuatedContext.state,
          [eventName]: !foundStateItem,
        },
      };
};
