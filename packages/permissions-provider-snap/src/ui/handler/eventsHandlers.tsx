import { logger } from '@metamask/7715-permissions-shared/utils';
import type { SnapsProvider, UserInputEventType } from '@metamask/snaps-sdk';

import type { SupportedPermissionTypes } from '../../orchestrators';
import { createPermissionOrchestrator } from '../../orchestrators';
import type { UserEventHandler } from '../../userEventDispatcher';
import { convertValueToHex } from '../../utils';
import { RulesSelectorElementNames } from '../components';
import type { PermissionConfirmationContext } from '../types';
import { updateInterface } from './renderHandler';

/**
 * Updates the interface with the new context object.
 *
 * @param permissionType - The permission type.
 * @param snapsProvider - The snaps provider.
 * @param interfaceId - The interface ID.
 * @param context - The context.
 */
const updateInterfaceHandler = async <
  TPermissionType extends SupportedPermissionTypes,
>(
  permissionType: TPermissionType,
  snapsProvider: SnapsProvider,
  interfaceId: string,
  context: PermissionConfirmationContext<TPermissionType>,
) => {
  await updateInterface(
    snapsProvider,
    interfaceId,
    createPermissionOrchestrator(permissionType).buildPermissionConfirmation(
      context,
    ),
    context,
  );
};

/**
 * Handles the user button click event for toggling a boolean value in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.interfaceId - The interface ID.
 * @param args.permissionType - The permission type.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleToggleBooleanClicked: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({ event, attenuatedContext, interfaceId, permissionType }) => {
  logger.debug(
    `Handling handleToggleBooleanClicked event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  const eventName = event.name ?? '';
  if (attenuatedContext.state[eventName] === undefined) {
    throw new Error(`Event name ${eventName} not found in state`);
  }

  await updateInterfaceHandler(permissionType, snap, interfaceId, {
    ...attenuatedContext,
    state: {
      ...attenuatedContext.state,
      [eventName]: !attenuatedContext.state[eventName],
    },
  });
};

/**
 * Handles the user input event for replacing a value in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.interfaceId - The interface ID.
 * @param args.permissionType - The permission type.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleReplaceValueInput: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({ event, attenuatedContext, interfaceId, permissionType }) => {
  logger.debug(
    `Handling handleReplaceValueInput event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  const eventName = event.name;
  if (attenuatedContext.state[eventName] === undefined) {
    throw new Error(`Event name ${eventName} not found in state`);
  }

  await updateInterfaceHandler(permissionType, snap, interfaceId, {
    ...attenuatedContext,
    state: {
      ...attenuatedContext.state,
      [eventName]: convertValueToHex(event.value as string),
    },
  });
};

/**
 * Handles the user input event for replacing text in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.interfaceId - The interface ID.
 * @param args.permissionType - The permission type.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleReplaceTextInput: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({ event, attenuatedContext, interfaceId, permissionType }) => {
  logger.debug(
    `Handling handleReplaceTextInput event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  const eventName = event.name;
  if (attenuatedContext.state[eventName] === undefined) {
    throw new Error(`Event name ${eventName} not found in state`);
  }

  await updateInterfaceHandler(permissionType, snap, interfaceId, {
    ...attenuatedContext,
    state: {
      ...attenuatedContext.state,
      [eventName]: event.value,
    },
  });
};

/**
 * Handles the user form submit event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.interfaceId - The interface ID.
 * @param args.permissionType - The permission type.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleFormSubmit: UserEventHandler<
  UserInputEventType.FormSubmitEvent
> = async ({ event, attenuatedContext, interfaceId, permissionType }) => {
  logger.debug(
    `Handling handleFormSubmit event:`,
    JSON.stringify({ attenuatedContext, event }, undefined, 2),
  );

  const rulesKeys = Object.keys(attenuatedContext.state.rules);
  let eventName = '';
  let value = '';

  // Extract the rule name and value from the form event.values
  Object.keys(event.value).forEach((eventValueKey) => {
    const extractedValue = event.value[eventValueKey] as string;
    if (rulesKeys.includes(extractedValue)) {
      eventName = extractedValue;
    } else {
      value = extractedValue;
    }
  });
  if (!eventName || !value) {
    throw new Error('Invalid event name or value');
  }

  // Update the context with the new value
  const updateContext = Object.keys(event.value).reduce(
    (acc, eventValueKey) => ({
      ...acc,
      state: {
        ...acc.state,
        [eventValueKey]: '', // Reset the form value to empty string
      },
    }),
    {
      ...attenuatedContext,
      state: {
        ...attenuatedContext.state,
        [RulesSelectorElementNames.AddMoreRulesPageToggle]: false,
        rules: {
          ...attenuatedContext.state.rules,
          [eventName]: value,
        },
      },
    },
  );

  await updateInterfaceHandler(
    permissionType,
    snap,
    interfaceId,
    updateContext,
  );
};

/**
 * Handles the user button click event for removing a rule from the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.interfaceId - The interface ID.
 * @param args.permissionType - The permission type.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleRemoveRuleClicked: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({ event, attenuatedContext, interfaceId, permissionType }) => {
  logger.debug(
    `Handling handleRemoveRuleClicked event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );

  const eventName = event.name ?? '';
  await updateInterfaceHandler(permissionType, snap, interfaceId, {
    ...attenuatedContext,
    state: {
      ...attenuatedContext.state,
      rules: {
        ...attenuatedContext.state.rules,
        [eventName]: null,
      },
    },
  });
};
