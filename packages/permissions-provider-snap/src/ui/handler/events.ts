import { logger } from '@metamask/7715-permissions-shared/utils';
import type { UserInputEventType } from '@metamask/snaps-sdk';

import type { UserEventHandler } from '../../userEventDispatcher';
import { updateContextStateHandler } from './stateHandler';

/**
 * Handles the user input event for toggling a boolean value in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const shouldToggleBool: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({ event, attenuatedContext }) => {
  logger.debug(
    `Handling shouldToggleBool event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  const eventName = event.name ?? '';
  const updatedContext = updateContextStateHandler(
    eventName,
    (state) => !state[eventName],
  );
  return updatedContext(attenuatedContext);
};

/**
 * Handles the user input event for removing a value from the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const shouldRemoveValue: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({ event, attenuatedContext }) => {
  logger.debug(
    `Handling shouldRemoveValue event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  const eventName = event.name ?? '';
  const updatedContext = updateContextStateHandler(eventName, () => undefined);
  return updatedContext(attenuatedContext);
};

/**
 * Handles the user input event for replacing a value in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const shouldReplaceValue: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({ event, attenuatedContext }) => {
  logger.debug(
    `Handling shouldReplaceValue event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  const eventName = event.name;
  const updatedContext = updateContextStateHandler(
    eventName,
    () => event.value,
  );
  return updatedContext(attenuatedContext);
};
