import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  ButtonClickEvent,
  InterfaceContext,
  UserInputEventType,
} from '@metamask/snaps-sdk';

import type { UserEventHandler } from '../../../userEventDispatcher';
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
  logger.debug(
    `Handling onAddMoreRulesButtonClick event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

export const rulesSelectorEventHandlers = {
  [RulesSelectorsEventNames.AddMoreRules]: onAddMoreRulesButtonClick,
};
