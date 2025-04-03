import { logger } from '@metamask/7715-permissions-shared/utils';
import type { ButtonClickEvent, UserInputEventType } from '@metamask/snaps-sdk';

import type {
  DialogContentEventHandlers,
  SupportedPermissionTypes,
} from '../../../orchestrators';
import type { UserEventHandler } from '../../../userEventDispatcher';
import type { PermissionConfirmationContext } from '../../types';
import { RulesSelectorsEventNames } from './RulesSelector';

/**
 * Handles the "Add more rules" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns The updated context.
 */
const onAddMoreRulesButtonClick: UserEventHandler<
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
    throw new Error('Event name is missing.');
  }
  if (!(eventName === RulesSelectorsEventNames.AddMoreRules)) {
    throw new Error(
      `Event name ${eventName} is not supported for the Add More Rules button.`,
    );
  }
  logger.debug(
    `Handling onAddMoreRulesButtonClick event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
  return attenuatedContext;
};

export const rulesSelectorEventHandlers: DialogContentEventHandlers[] = [
  {
    eventName: RulesSelectorsEventNames.AddMoreRules,
    handler: onAddMoreRulesButtonClick as UserEventHandler<UserInputEventType>,
  },
];
