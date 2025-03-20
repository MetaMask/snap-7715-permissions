import { logger } from '@metamask/7715-permissions-shared/utils';

import type { EventHandler } from '../../types';
import { RequestDetailsEventNames } from './RequestDetails';

/**
 * Handles the "Show More" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.id - The id of the interface.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onShowMoreButtonClick: EventHandler = async ({ id, event, context }) => {
  logger.debug(
    `Handlingn onShowMoreButtonClick event:`,
    JSON.stringify({ id, event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

export const eventHandlers = {
  [RequestDetailsEventNames.ShowMoreButton]: onShowMoreButtonClick,
};
