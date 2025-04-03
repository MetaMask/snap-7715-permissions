import { logger } from '@metamask/7715-permissions-shared/utils';
import type { UserInputEventType } from '@metamask/snaps-sdk';

import type { UserEventHandler } from '../../../userEventDispatcher';
import { RequestDetailsEventNames } from './RequestDetails';

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
  const foundState =
    attenuatedContext.state[RequestDetailsEventNames.ShowMoreButton];

  return foundState === undefined ||
    event.name !== RequestDetailsEventNames.ShowMoreButton
    ? attenuatedContext
    : {
        ...attenuatedContext,
        state: {
          ...attenuatedContext.state,
          [RequestDetailsEventNames.ShowMoreButton]: !foundState,
        },
      };
};
