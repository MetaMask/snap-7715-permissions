import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  ButtonClickEvent,
  InputChangeEvent,
  InterfaceContext,
  UserInputEventType,
} from '@metamask/snaps-sdk';

import type { UserEventHandler } from '../../../userEventDispatcher';
import { NativeTokenStreamPermissionRulesEventNames } from './NativeTokenStreamPermissionRules';

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
  logger.debug(
    `Handling onExpiryRemoveButtonClick event:`,
    JSON.stringify({ event, context }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
};

export const requestDetailsEventHandlers = {
  // input change events handlers
  [NativeTokenStreamPermissionRulesEventNames.InitialAmount]:
    onInitialAmountInputChange,
  [NativeTokenStreamPermissionRulesEventNames.MaxAllowance]:
    onMaxAllowanceInputChange,
  [NativeTokenStreamPermissionRulesEventNames.StartTime]:
    onStartTimeInputChange,
  [NativeTokenStreamPermissionRulesEventNames.Expiry]: onExpiryInputChange,

  // remove button click events handlers
  [NativeTokenStreamPermissionRulesEventNames.InitialAmountRemove]:
    onInitialAmountRemoveButtonClick,
  [NativeTokenStreamPermissionRulesEventNames.MaxAllowanceRemove]:
    onMaxAllowanceRemoveButtonClick,
  [NativeTokenStreamPermissionRulesEventNames.StartTimeRemove]:
    onStartTimeRemoveButtonClick,
  [NativeTokenStreamPermissionRulesEventNames.ExpiryRemove]:
    onExpiryRemoveButtonClick,
};
