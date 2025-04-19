import { logger } from '@metamask/7715-permissions-shared/utils';
import type { UserInputEventType } from '@metamask/snaps-sdk';
import { parseEther, toHex } from 'viem';

import type { UserEventHandler } from '../../core';
import type { SupportedPermissionTypes } from '../../permissions';
import { RulesSelectorElementNames } from '../components';
import type { PermissionConfirmationContext } from '../types';

type CommonEventHandlers = {
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
  elementName: string;
};

type CommonEventHandlersFunction = (
  args: CommonEventHandlers,
) => PermissionConfirmationContext<SupportedPermissionTypes>;

/**
 * Handles the user button click event for toggling a boolean value in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.elementName - The name of the element that was clicked.
 * @param args.attenuatedContext - The interface context.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleToggleBooleanClicked: CommonEventHandlersFunction = ({
  attenuatedContext,
  elementName,
}) => {
  logger.debug(
    `Handling handleToggleBooleanClicked event:`,
    JSON.stringify({ attenuatedContext, elementName }, undefined, 2),
  );
  if (attenuatedContext.state[elementName] === undefined) {
    throw new Error(`Element name ${elementName} not found in state`);
  }

  return {
    ...attenuatedContext,
    state: {
      ...attenuatedContext.state,
      [elementName]: !attenuatedContext.state[elementName],
    },
  };
};

/**
 * Handles the user input event for replacing a value in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.interfaceId - The interface ID.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleReplaceValueInput: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({ event, attenuatedContext, interfaceId }) => {
  logger.debug(
    `Handling handleReplaceValueInput event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );

  const { name: elementName, value } = event;

  if (typeof value !== 'string') {
    throw new Error('Event value is not a string');
  }

  if (attenuatedContext.state[elementName] === undefined) {
    throw new Error(`Element name ${elementName} not found in state`);
  }

  const valueAsHex = toHex(parseEther(value));

  const updatedContext = {
    ...attenuatedContext,
    state: {
      ...attenuatedContext.state,
      [elementName]: valueAsHex,
    },
  };
};

/**
 * Handles the user input event for replacing text in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.interfaceId - The interface ID.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleReplaceTextInput: UserEventHandler<
  UserInputEventType.InputChangeEvent
> = async ({ event, attenuatedContext, interfaceId }) => {
  logger.debug(
    `Handling handleReplaceTextInput event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  const elementName = event.name;
  if (attenuatedContext.state[elementName] === undefined) {
    throw new Error(`Element name ${elementName} not found in state`);
  }

  const updatedContext = {
    ...attenuatedContext,
    state: {
      ...attenuatedContext.state,
      [elementName]: event.value,
    },
  };
};

/**
 * Handles the user form submit event.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.interfaceId - The interface ID.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleFormSubmit: UserEventHandler<
  UserInputEventType.FormSubmitEvent
> = async ({ event, attenuatedContext, interfaceId }) => {
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
};

/**
 * Handles the user button click event for removing a rule from the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.event - The user input event.
 * @param args.attenuatedContext - The interface context.
 * @param args.interfaceId - The interface ID.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleRemoveRuleClicked: UserEventHandler<
  UserInputEventType.ButtonClickEvent
> = async ({ event, attenuatedContext, interfaceId }) => {
  logger.debug(
    `Handling handleRemoveRuleClicked event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );

  const eventName = event.name ?? '';
  const updatedContext = {
    ...attenuatedContext,
    state: {
      ...attenuatedContext.state,
      rules: {
        ...attenuatedContext.state.rules,
        [eventName]: null,
      },
    },
  };
};
