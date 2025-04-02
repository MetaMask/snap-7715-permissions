import { logger } from '@metamask/7715-permissions-shared/utils';
import type { ButtonClickEvent } from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

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
    return;
  }
  if (!(eventName === RulesSelectorsEventNames.AddMoreRules)) {
    return;
  }
  logger.debug(
    `Handling onAddMoreRulesButtonClick event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

export const rulesSelectorEventHandlers: DialogContentEventHandlers[] = [
  {
    state: {},
    eventType: UserInputEventType.ButtonClickEvent,
    handler: onAddMoreRulesButtonClick as UserEventHandler<UserInputEventType>,
  },
];
