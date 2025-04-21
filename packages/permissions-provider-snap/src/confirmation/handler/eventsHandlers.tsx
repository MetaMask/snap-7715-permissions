import { logger } from '@metamask/7715-permissions-shared/utils';
import { parseEther, toHex } from 'viem';

import type { SupportedPermissionTypes } from '../../permissions';
import { RulesSelectorElementNames } from '../components';
import type { PermissionConfirmationContext } from '../types';

type ButtonClickEventHandlers = {
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
  elementName: string;
};

type ButtonClickHandlersFunction = (
  args: ButtonClickEventHandlers,
) => PermissionConfirmationContext<SupportedPermissionTypes> | null;

type RuleFormSubmitEventHandlers = {
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
  values: Record<
    string,
    | string
    | boolean
    | {
        name: string;
        size: number;
        contentType: string;
        contents: string;
      }
    | null
  >;
};

type RuleFormSubmitHandlersFunction = (
  args: RuleFormSubmitEventHandlers,
) => PermissionConfirmationContext<SupportedPermissionTypes> | null;

type ValueInputEventHandlers = {
  attenuatedContext: PermissionConfirmationContext<SupportedPermissionTypes>;
  elementName: string;
  value: string;
};

type ValueChangeHandlersFunction = (
  args: ValueInputEventHandlers,
) => PermissionConfirmationContext<SupportedPermissionTypes> | null;

/**
 * Handles the user button click event for toggling a boolean value in the attenuated context.
 *
 * @param args - The user input handler args as object.
 * @param args.elementName - The name of the element that was clicked.
 * @param args.attenuatedContext - The interface context.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleToggleBooleanClicked: ButtonClickHandlersFunction = ({
  attenuatedContext,
  elementName,
}) => {
  logger.debug(
    `Handling handleToggleBooleanClicked event:`,
    JSON.stringify({ attenuatedContext, elementName }, undefined, 2),
  );
  if (attenuatedContext.state[elementName] === undefined) {
    return null;
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
 * @param args.elementName - The name of the element that was clicked.
 * @param args.attenuatedContext - The interface context.
 * @param args.value - The value of the event.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleReplaceValueInput: ValueChangeHandlersFunction = ({
  attenuatedContext,
  elementName,
  value,
}) => {
  logger.debug(
    `Handling handleReplaceValueInput event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );

  if (attenuatedContext.state[elementName] === undefined) {
    return null;
  }

  const valueAsHex = toHex(parseEther(value));

  return {
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
 * @param args.elementName - The name of the element that was clicked.
 * @param args.attenuatedContext - The interface context.
 * @param args.value - The value of the event.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleReplaceTextInput: ValueChangeHandlersFunction = ({
  attenuatedContext,
  elementName,
  value,
}) => {
  logger.debug(
    `Handling handleReplaceTextInput event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );
  if (attenuatedContext.state[elementName] === undefined) {
    return null;
  }

  return {
    ...attenuatedContext,
    state: {
      ...attenuatedContext.state,
      [elementName]: value,
    },
  };
};

/**
 * Handles the user form submit event.
 *
 * @param args - The user input handler args as object.
 * @param args.attenuatedContext - The interface context.
 * @param args.values - The value of the event.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleFormSubmit: RuleFormSubmitHandlersFunction = ({
  attenuatedContext,
  values,
}) => {
  logger.debug(
    `Handling handleFormSubmit event:`,
    JSON.stringify({ attenuatedContext, values }, undefined, 2),
  );

  const rulesKeys = Object.keys(attenuatedContext.state.rules);
  let eventName = '';
  let value = '';

  // Extract the rule name and value from the form event.values
  Object.keys(values).forEach((eventValueKey) => {
    const extractedValue = values[eventValueKey] as string;
    if (rulesKeys.includes(extractedValue)) {
      eventName = extractedValue;
    } else {
      value = extractedValue;
    }
  });
  if (!eventName || !value) {
    return null;
  }

  return Object.keys(values).reduce(
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
 * @param args.elementName - The name of the element that was clicked.
 * @param args.attenuatedContext - The interface context.
 * @returns Returns a new copy of the attenuatedContext to capture mutation rather than mutating the original state or
 * returns the original state if event name in incorrect.
 */
export const handleRemoveRuleClicked: ButtonClickHandlersFunction = ({
  attenuatedContext,
  elementName,
}) => {
  logger.debug(
    `Handling handleRemoveRuleClicked event:`,
    JSON.stringify({ attenuatedContext }, undefined, 2),
  );

  const rules = attenuatedContext.state.rules as Record<string, string | null>;
  if (rules[elementName] === undefined) {
    return null;
  }

  return {
    ...attenuatedContext,
    state: {
      ...attenuatedContext.state,
      rules: {
        ...attenuatedContext.state.rules,
        [elementName]: null,
      },
    },
  };
};
