import { logger } from '@metamask/7715-permissions-shared/utils';
import type { ButtonClickEvent, InterfaceContext } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type {
  DialogContentEventHandlers,
  UserEventHandler,
} from '../../../userEventDispatcher';
import { RulesSelectorsEventNames } from './RulesSelector';

/**
 * Handles the "Add more rules" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onAddMoreRulesButtonClick: UserEventHandler<
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
  if (!(eventName === RulesSelectorsEventNames.AddMoreRules)) {
    return;
  }
  logger.debug(
    `Handling onAddMoreRulesButtonClick event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

export const rulesSelectorEventHandlers: DialogContentEventHandlers[] = [
  {
    eventType: UserInputEventType.ButtonClickEvent,
    handler: onAddMoreRulesButtonClick as UserEventHandler<UserInputEventType>,
  },
];
