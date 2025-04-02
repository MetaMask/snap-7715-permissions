import { logger } from '@metamask/7715-permissions-shared/utils';
import type { ButtonClickEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type {
  DialogContentEventHandlers,
  SupportedPermissionTypes,
} from '../../../orchestrators';
import type { UserEventHandler } from '../../../userEventDispatcher';
import type { PermissionConfirmationContext } from '../../types';
import { RequestDetailsEventNames } from './RequestDetails';

/**
 * Handles the "Show More" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 */
const onShowMoreButtonClick: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({
  event,
  attenuatedContext,
}: {
  event: ButtonClickEvent;
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
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
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
};

export const requestDetailsButtonEventHandlers: DialogContentEventHandlers[] = [
  {
    state: {},
    eventType: UserInputEventType.ButtonClickEvent,
    handler: onShowMoreButtonClick as UserEventHandler<UserInputEventType>,
  },
];
