import { logger } from '@metamask/7715-permissions-shared/utils';
import type {
  ButtonClickEvent,
  InputChangeEvent,
  UserInputEventType,
} from '@metamask/snaps-sdk';

import type {
  DialogContentEventHandlers,
  SupportedPermissionTypes,
} from '../../../../orchestrators';
import type { UserEventHandler } from '../../../../userEventDispatcher';
import type { PermissionConfirmationContext } from '../../../types';
import { NativeTokenStreamRulesEventNames } from './NativeTokenStreamRules';

/**
 * Handles the "initial-amount" value change event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns The updated context.
 */
const onInitialAmountInputChange: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({
  event,
  attenuatedContext,
}: {
  event: InputChangeEvent;
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
}) => {
  const eventName = event.name;
  if (!eventName) {
    throw new Error('Event name is missing.');
  }
  if (!(eventName === NativeTokenStreamRulesEventNames.InitialAmount)) {
    throw new Error(
      `Event name ${eventName} is not supported for the Initial Amount input.`,
    );
  }
  logger.debug(
    `Handling onInitialAmountInputChange event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
  return attenuatedContext;
};

/**
 * Handles the "initial-amount" "remove" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns The updated context.
 */
const onInitialAmountRemoveButtonClick: UserEventHandler<
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
  if (!(eventName === NativeTokenStreamRulesEventNames.InitialAmountRemove)) {
    throw new Error(
      `Event name ${eventName} is not supported for the Initial Amount Remove button.`,
    );
  }
  logger.debug(
    `Handling onInitialAmountRemoveButtonClick event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
  return attenuatedContext;
};

/**
 * Handles the "max-allowance" value change event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns The updated context.
 */
const onMaxAllowanceInputChange: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({
  event,
  attenuatedContext,
}: {
  event: InputChangeEvent;
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
}) => {
  const eventName = event.name;
  if (!eventName) {
    throw new Error('Event name is missing.');
  }
  if (!(eventName === NativeTokenStreamRulesEventNames.MaxAllowance)) {
    throw new Error(
      `Event name ${eventName} is not supported for the Max Allowance input.`,
    );
  }
  logger.debug(
    `Handling onMaxAllowanceInputChange event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
  return attenuatedContext;
};

/**
 * Handles the "max-allowance" "remove" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns The updated context.
 */
const onMaxAllowanceRemoveButtonClick: UserEventHandler<
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
  if (!(eventName === NativeTokenStreamRulesEventNames.MaxAllowanceRemove)) {
    throw new Error(
      `Event name ${eventName} is not supported for the Max Allowance Remove button.`,
    );
  }
  logger.debug(
    `Handling onMaxAllowanceRemoveButtonClick event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
  return attenuatedContext;
};

/**
 * Handles the "start time" value change event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns The updated context.
 */
const onStartTimeInputChange: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({
  event,
  attenuatedContext,
}: {
  event: InputChangeEvent;
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
}) => {
  const eventName = event.name;
  if (!eventName) {
    throw new Error('Event name is missing.');
  }
  if (!(eventName === NativeTokenStreamRulesEventNames.StartTime)) {
    throw new Error(
      `Event name ${eventName} is not supported for the Start Time input.`,
    );
  }
  logger.debug(
    `Handling onStartTimeInputChange event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
  return attenuatedContext;
};

/**
 * Handles the "start time" "remove" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns The updated context.
 */
const onStartTimeRemoveButtonClick: UserEventHandler<
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
  if (!(eventName === NativeTokenStreamRulesEventNames.StartTimeRemove)) {
    throw new Error(
      `Event name ${eventName} is not supported for the Start Time Remove button.`,
    );
  }
  logger.debug(
    `Handling onStartTimeRemoveButtonClick event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
  return attenuatedContext;
};

/**
 * Handles the "expiry" value change event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns The updated context.
 */
const onExpiryInputChange: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({
  event,
  attenuatedContext,
}: {
  event: InputChangeEvent;
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
}) => {
  const eventName = event.name;
  if (!eventName) {
    throw new Error('Event name is missing.');
  }
  if (!(eventName === NativeTokenStreamRulesEventNames.Expiry)) {
    throw new Error(
      `Event name ${eventName} is not supported for the Expiry input.`,
    );
  }
  logger.debug(
    `Handling onInitialAmountInputChange event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
  return attenuatedContext;
};

/**
 * Handles the "expiry" "remove" button click event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns The updated context.
 */
const onExpiryRemoveButtonClick: UserEventHandler<
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
  if (!(eventName === NativeTokenStreamRulesEventNames.ExpiryRemove)) {
    throw new Error(
      `Event name ${eventName} is not supported for the Expiry Remove button.`,
    );
  }
  logger.debug(
    `Handling onExpiryRemoveButtonClick event:`,
    JSON.stringify({ event, attenuatedContext }, undefined, 2),
  );
  // TODO: Add the event handle logic to make the button interactive
  return attenuatedContext;
};

export const nativeTokenStreamRulesEventHandlers: DialogContentEventHandlers[] =
  [
    // input change events handlers
    {
      eventName: NativeTokenStreamRulesEventNames.InitialAmount,
      handler:
        onInitialAmountInputChange as UserEventHandler<UserInputEventType>,
    },
    {
      eventName: NativeTokenStreamRulesEventNames.MaxAllowance,
      handler:
        onMaxAllowanceInputChange as UserEventHandler<UserInputEventType>,
    },
    {
      eventName: NativeTokenStreamRulesEventNames.StartTime,
      handler: onStartTimeInputChange as UserEventHandler<UserInputEventType>,
    },
    {
      eventName: NativeTokenStreamRulesEventNames.Expiry,
      handler: onExpiryInputChange as UserEventHandler<UserInputEventType>,
    },

    // remove button click events handlers
    {
      eventName: NativeTokenStreamRulesEventNames.InitialAmountRemove,
      handler:
        onInitialAmountRemoveButtonClick as UserEventHandler<UserInputEventType>,
    },
    {
      eventName: NativeTokenStreamRulesEventNames.MaxAllowanceRemove,
      handler:
        onMaxAllowanceRemoveButtonClick as UserEventHandler<UserInputEventType>,
    },
    {
      eventName: NativeTokenStreamRulesEventNames.StartTimeRemove,
      handler:
        onStartTimeRemoveButtonClick as UserEventHandler<UserInputEventType>,
    },
    {
      eventName: NativeTokenStreamRulesEventNames.ExpiryRemove,
      handler:
        onExpiryRemoveButtonClick as UserEventHandler<UserInputEventType>,
    },
  ];
