import { logger } from '@metamask/7715-permissions-shared/utils';
import type { UserInputEventType } from '@metamask/snaps-sdk';

import { createPermissionOrchestrator } from '../../orchestrators';
import type { UserEventHandler } from '../../userEventDispatcher';
import { convertBalanceToHex } from '../../utils';
import { RulesSelectorElementNames } from '../components';
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

  const rulesKeys = Object.keys(attenuatedContext.state.rules);
  let eventName = '';
  let value = '';
  Object.keys(event.value).forEach((eventValueKey) => {
    const extractedValue = event.value[eventValueKey] as string;
    if (rulesKeys.includes(extractedValue)) {
      eventName = extractedValue;
    } else {
      value = extractedValue;
    }
  });
  if (!eventName || !value) {
    return;
  }

  // Rest to form values to empty string by passing the updated context to capture all mutations
  // A better approach would be to have `updateContextStateHandler` accept a array of keys to update rather than a single key
  const updatedContextRulesFunc = updateContextStateHandler(
    'rules',
    (state) => ({
      ...state.rules,
      [eventName]: value,
    }),
  );

  const updatedRulesContext = Object.keys(event.value).reduce(
    (acc, eventValueKey) => {
      const updatedContextFormFunc = updateContextStateHandler(
        eventValueKey,
        (state) => (state[eventValueKey] = ''),
      );
      return updatedContextFormFunc(acc);
    },
    updatedContextRulesFunc(attenuatedContext),
  );

  // Close the rules selector after form submit
  const updatedContextRulesPageToggleFunc = updateContextStateHandler(
    RulesSelectorElementNames.AddMoreRulesPageToggle,
    (state) => !state[RulesSelectorElementNames.AddMoreRulesPageToggle],
  );

  const updatedContext = updatedContextRulesPageToggleFunc(updatedRulesContext);

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
 * Handles the user button click event for removing a rule from the attenuated context.
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
export const handleRemoveRuleClicked: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({
  event,
  attenuatedContext,
  snapsProvider,
  interfaceId,
  permissionType,
}) => {
  logger.debug(
    `Handling handleRemoveRuleClicked event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );

  const eventName = event.name ?? '';
  const updatedContextRulesFunc = updateContextStateHandler(
    'rules',
    (state) => ({
      ...state.rules,
      [eventName]: null,
    }),
  );
  const updatedContext = updatedContextRulesFunc(attenuatedContext);
  await updateInterface(
    snapsProvider,
    interfaceId,
    createPermissionOrchestrator(permissionType).buildPermissionConfirmation(
      updatedContext,
    ),
    updatedContext,
  );
};
