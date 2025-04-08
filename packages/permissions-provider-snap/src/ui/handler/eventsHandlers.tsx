import { logger } from '@metamask/7715-permissions-shared/utils';
import type { UserInputEventType } from '@metamask/snaps-sdk';

import { createPermissionOrchestrator } from '../../orchestrators';
import type { UserEventHandler } from '../../userEventDispatcher';
import { convertBalanceToHex } from '../../utils';
import { updateInterface } from './renderHandler';
import { updateContextStateHandler } from './stateHandler';

/**
 * Handles the user button click event for toggling a boolean value in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.snapsProvider - The snaps provider.
 * @param args.interfaceId - The interface ID.
 * @param args.permissionType - The permission type.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleToggleBooleanClicked: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({
  event,
  attenuatedContext,
  snapsProvider,
  interfaceId,
  permissionType,
}) => {
  logger.debug(
    `Handling handleToggleBooleanClicked event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  const eventName = event.name ?? '';
  if (attenuatedContext.state[eventName] === undefined) {
    return;
  }

  const updatedContextFunc = updateContextStateHandler(
    eventName,
    (state) => !state[eventName],
  );

  const updatedContext = updatedContextFunc(attenuatedContext);
  await updateInterface(
    snapsProvider,
    interfaceId,
    createPermissionOrchestrator(permissionType).buildPermissionConfirmation(
      updatedContext,
    ),
    updatedContext,
  );
};

/**
 * Handles the user input event for replacing a value in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.snapsProvider - The snaps provider.
 * @param args.interfaceId - The interface ID.
 * @param args.permissionType - The permission type.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleReplaceValueInput: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({
  event,
  attenuatedContext,
  snapsProvider,
  interfaceId,
  permissionType,
}) => {
  logger.debug(
    `Handling handleReplaceValueInput event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  const eventName = event.name;
  if (attenuatedContext.state[eventName] === undefined) {
    return;
  }

  const updatedContextFunc = updateContextStateHandler(eventName, () =>
    convertBalanceToHex(event.value as string),
  );

  const updatedContext = updatedContextFunc(attenuatedContext);
  await updateInterface(
    snapsProvider,
    interfaceId,
    createPermissionOrchestrator(permissionType).buildPermissionConfirmation(
      updatedContext,
    ),
    updatedContext,
  );
};

/**
 * Handles the user input event for replacing text in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.snapsProvider - The snaps provider.
 * @param args.interfaceId - The interface ID.
 * @param args.permissionType - The permission type.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleReplaceTextInput: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({
  event,
  attenuatedContext,
  snapsProvider,
  interfaceId,
  permissionType,
}) => {
  logger.debug(
    `Handling handleReplaceTextInput event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  const eventName = event.name;
  if (attenuatedContext.state[eventName] === undefined) {
    return;
  }

  const updatedContextFunc = updateContextStateHandler(
    eventName,
    () => event.value,
  );

  const updatedContext = updatedContextFunc(attenuatedContext);
  await updateInterface(
    snapsProvider,
    interfaceId,
    createPermissionOrchestrator(permissionType).buildPermissionConfirmation(
      updatedContext,
    ),
    updatedContext,
  );
};

/**
 * Handles the user form submit event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.snapsProvider - The snaps provider.
 * @param args.interfaceId - The interface ID.
 * @param args.permissionType - The permission type.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleFormSubmit: UserEventHandler<
  UserInputEventType.FormSubmitEvent
> = async ({
  event,
  attenuatedContext,
  snapsProvider,
  interfaceId,
  permissionType,
}) => {
  logger.debug(
    `Handling handleFormSubmit event:`,
    JSON.stringify({ attenuatedContext, event }, undefined, 2),
  );

  // Find the key in the event.value that is in the state
  const stateKey = Object.keys(event.value).find(
    (eventValueKey) => attenuatedContext.state[eventValueKey] !== undefined,
  );

  // const updatedContextFunc = updateContextStateHandler(
  //   stateKey,
  //   () => '12/12/2026', // TODO: Figure out how find the value key in the event.value
  // );
  // const updatedContext = updatedContextFunc(attenuatedContext);

  // TODO: push to active rules without hardcoding
  // const updatedContextActiveRulesFunc = updateContextStateHandler(
  //   NativeTokenStreamDialogElementNames.ActiveRulesStateKeys,
  //   (state) => [
  //     ...state[NativeTokenStreamDialogElementNames.ActiveRulesStateKeys],
  //     stateKey,
  //   ],
  // );

  // const updatedContextActiveRules =
  //   updatedContextActiveRulesFunc(updatedContext);

  // await updateInterface(
  //   snapsProvider,
  //   interfaceId,
  //   createPermissionOrchestrator(permissionType).buildPermissionConfirmation(
  //     updatedContext,
  //   ),
  //   updatedContext,
  // );
};
