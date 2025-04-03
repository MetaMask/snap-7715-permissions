import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  ButtonClickEvent,
  InputChangeEvent,
  InterfaceContext,
} from '@metamask/snaps-sdk';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type {
  DialogContentEventHandlers,
  UserEventHandler,
} from '../../../../userEventDispatcher';
import { NativeTokenStreamRulesEventNames } from './NativeTokenStreamRules';

/**
 * Handles the "initial-amount" value change event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onInitialAmountInputChange: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({
  event,
  context,
}: {
  event: InputChangeEvent;
  context: InterfaceContext | null;
}) => {
  const eventName = event.name;
  if (!eventName) {
    return;
  }
  if (!(eventName === NativeTokenStreamRulesEventNames.InitialAmount)) {
    return;
  }
  logger.debug(
    `Handling onInitialAmountInputChange event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

/**
 * Handles the "initial-amount" "remove" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onInitialAmountRemoveButtonClick: UserEventHandler<
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
  if (!(eventName === NativeTokenStreamRulesEventNames.InitialAmountRemove)) {
    return;
  }
  logger.debug(
    `Handling onInitialAmountRemoveButtonClick event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

/**
 * Handles the "max-allowance" value change event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onMaxAllowanceInputChange: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({
  event,
  context,
}: {
  event: InputChangeEvent;
  context: InterfaceContext | null;
}) => {
  const eventName = event.name;
  if (!eventName) {
    return;
  }
  if (!(eventName === NativeTokenStreamRulesEventNames.MaxAllowance)) {
    return;
  }
  logger.debug(
    `Handling onMaxAllowanceInputChange event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

/**
 * Handles the "max-allowance" "remove" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onMaxAllowanceRemoveButtonClick: UserEventHandler<
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
  if (!(eventName === NativeTokenStreamRulesEventNames.MaxAllowanceRemove)) {
    return;
  }
  logger.debug(
    `Handling onMaxAllowanceRemoveButtonClick event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

/**
 * Handles the "start time" value change event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onStartTimeInputChange: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({
  event,
  context,
}: {
  event: InputChangeEvent;
  context: InterfaceContext | null;
}) => {
  const eventName = event.name;
  if (!eventName) {
    return;
  }
  if (!(eventName === NativeTokenStreamRulesEventNames.StartTime)) {
    return;
  }
  logger.debug(
    `Handling onStartTimeInputChange event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

/**
 * Handles the "start time" "remove" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onStartTimeRemoveButtonClick: UserEventHandler<
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
  if (!(eventName === NativeTokenStreamRulesEventNames.StartTimeRemove)) {
    return;
  }
  logger.debug(
    `Handling onStartTimeRemoveButtonClick event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

/**
 * Handles the "expiry" value change event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onExpiryInputChange: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({
  event,
  context,
}: {
  event: InputChangeEvent;
  context: InterfaceContext | null;
}) => {
  const eventName = event.name;
  if (!eventName) {
    return;
  }
  if (!(eventName === NativeTokenStreamRulesEventNames.Expiry)) {
    return;
  }
  logger.debug(
    `Handling onInitialAmountInputChange event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

/**
 * Handles the "expiry" "remove" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.context - The interface context.
 */
const onExpiryRemoveButtonClick: UserEventHandler<
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
  if (!(eventName === NativeTokenStreamRulesEventNames.ExpiryRemove)) {
    return;
  }
  logger.debug(
    `Handling onExpiryRemoveButtonClick event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

export const nativeTokenStreamRulesEventHandlers: DialogContentEventHandlers[] =
  [
    // input change events handlers
    {
      eventType: UserInputEventType.InputChangeEvent,
      handler:
        onInitialAmountInputChange as UserEventHandler<UserInputEventType>,
    },
    {
      eventType: UserInputEventType.InputChangeEvent,
      handler:
        onMaxAllowanceInputChange as UserEventHandler<UserInputEventType>,
    },
    {
      eventType: UserInputEventType.InputChangeEvent,
      handler: onStartTimeInputChange as UserEventHandler<UserInputEventType>,
    },
    {
      eventType: UserInputEventType.InputChangeEvent,
      handler: onExpiryInputChange as UserEventHandler<UserInputEventType>,
    },

    // remove button click events handlers
    {
      eventType: UserInputEventType.ButtonClickEvent,
      handler:
        onInitialAmountRemoveButtonClick as UserEventHandler<UserInputEventType>,
    },
    {
      eventType: UserInputEventType.ButtonClickEvent,
      handler:
        onMaxAllowanceRemoveButtonClick as UserEventHandler<UserInputEventType>,
    },
    {
      eventType: UserInputEventType.ButtonClickEvent,
      handler:
        onStartTimeRemoveButtonClick as UserEventHandler<UserInputEventType>,
    },
    {
      eventType: UserInputEventType.ButtonClickEvent,
      handler:
        onExpiryRemoveButtonClick as UserEventHandler<UserInputEventType>,
    },
  ];
