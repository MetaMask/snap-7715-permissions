import { UserInputEventType } from '@metamask/snaps-sdk';
import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';

import { DropdownField } from '../ui/components/DropdownField';
import { InputField } from '../ui/components/InputField';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../userEventDispatcher';
import type { BaseContext, DateTimeParameterNames, RuleDefinition } from './types';
import { DateTimeField } from '../ui/components/DateTimeField';
import { combineDateAndTimeToTimestamp, convertTimestampToReadableDate, convertTimestampToReadableTime } from '../utils/time';

/**
 * Utility function to access nested properties in an object using dot notation.
 * For example: getNestedProperty(obj, 'permissionDetails.startTime')
 * 
 * @param obj - The object to access properties from
 * @param path - The dot-notation path to the property
 * @returns The value at the specified path, or undefined if not found
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Renders a single rule with the provided configuration, context and metadata.
 * @param options0 - The options object.
 * @param options0.rule - The rule definition to render.
 * @param options0.context - The current context state.
 * @param options0.metadata - Additional metadata for error validation.
 * @returns The rendered rule element or null if the rule value is undefined.
 */
export function renderRule<
  TContext extends BaseContext,
  TMetadata extends object,
>({
  rule,
  context,
  metadata,
}: {
  rule: RuleDefinition<TContext, TMetadata>;
  context: TContext;
  metadata: TMetadata;
}): GenericSnapElement | null {
  const { label, type, name, isOptional } = rule;
  const {
    value,
    error,
    tooltip,
    iconData,
    isVisible,
    options,
    isAdjustmentAllowed,
    dateTimeParameterNames
  } = rule.getRuleData({ context, metadata });

  if (value === null || value === undefined || !isVisible) {
    // If the value is not set, don't render the rule
    return null;
  }

  const isDisabled = !isAdjustmentAllowed;
  const removeButtonName = isOptional ? `${name}_removeButton` : undefined;

  switch (type) {
    case 'number':
    case 'text': {
      return (
        <InputField
          label={label}
          name={name}
          value={value ?? ''}
          errorMessage={error}
          disabled={isDisabled}
          tooltip={tooltip}
          type={type}
          removeButtonName={removeButtonName}
          iconData={iconData}
        />
      );
    }
    case 'dropdown': {
      if (!options) {
        // todo: type constraint on this would be nice
        throw new Error('Dropdown rule must have options');
      }

      return (
        <DropdownField
          label={label}
          name={name}
          options={options}
          value={value ?? ''}
          errorMessage={error}
          disabled={isDisabled}
          tooltip={tooltip}
        />
      );
    }
    case 'datetime': {

      if (!dateTimeParameterNames) {
        throw new Error('DateTime rule must have dateTimeParameterNames');
      }

      const value = {
        timestamp: getNestedProperty(context, dateTimeParameterNames.timestampName),
        date: getNestedProperty(context, dateTimeParameterNames.dateName),
        time: getNestedProperty(context, dateTimeParameterNames.timeName),
      }

      return (
        <DateTimeField
          label={label}
          name={name}
          value={value ?? ''}
          errorMessage={error}
          disabled={isDisabled}
          tooltip={tooltip}
          removeButtonName={removeButtonName}
          iconData={iconData}
        />
      );
    }
    default: {
      throw new Error(`Unknown rule type: ${type as string}`);
    }
  }
}

/**
 * Renders a list of rules the the provided configuration, context and metadata.
 * @param options0 - The options object.
 * @param options0.rules - The array of rule definitions to render.
 * @param options0.context - The current context state.
 * @param options0.metadata - Additional metadata for error validation.
 * @returns An array of rendered rule elements (or null for undefined rule values).
 */
export function renderRules<
  TContext extends BaseContext,
  TMetadata extends object,
>({
  rules,
  context,
  metadata,
}: {
  rules: RuleDefinition<TContext, TMetadata>[];
  context: TContext;
  metadata: TMetadata;
}): (GenericSnapElement | null)[] {
  return rules.map((rule) => renderRule({ rule, context, metadata }));
}

/**
 * Binds the handlers for the provided rules to the user event dispatcher.
 * @param options0 - The options object.
 * @param options0.rules - The array of rule definitions to bind handlers for.
 * @param options0.userEventDispatcher - The user event dispatcher to bind handlers to.
 * @param options0.interfaceId - The interface ID for the event handlers.
 * @param options0.getContext - Function to get the current context state.
 * @param options0.onContextChanged - Function called when context changes.
 * @returns A function that unbinds the handlers when called.
 */
export function bindRuleHandlers<
  TContext extends BaseContext,
  TMetadata extends object,
>({
  rules,
  userEventDispatcher,
  interfaceId,
  getContext,
  deriveMetadata,
  onContextChanged,
}: {
  rules: RuleDefinition<TContext, TMetadata>[];
  userEventDispatcher: UserEventDispatcher;
  interfaceId: string;
  getContext: () => TContext;
  deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;
  onContextChanged: (args: { context: TContext }) => Promise<void>;
}): () => void {
  const handlers = rules.reduce<
    {
      elementName: string;
      eventType: UserInputEventType;
      handler: UserEventHandler<UserInputEventType>;
    }[]
  >((acc, rule) => {
    const { name, isOptional, type, getRuleData } = rule;

    const handleInputChange: UserEventHandler<
      UserInputEventType.InputChangeEvent
    > = async ({ event }) => {
      const updatedContext = rule.updateContext(
        getContext(),
        event.value as string,
      );
      await onContextChanged({ context: updatedContext });
    };

    const handleDateInputChange: UserEventHandler<
      UserInputEventType.InputChangeEvent
    > = async ({ event }) => {
      const fieldName = event.name;
      const isDateField = fieldName.endsWith('_date');
      const isTimeField = fieldName.endsWith('_time');
      
      const context = getContext();
      const metadata = await deriveMetadata({ context });

      const ruleData = getRuleData({ context, metadata });

      const dateTimeParameterNames = ruleData.dateTimeParameterNames!;

      const currentValues = {
        timestamp: getNestedProperty(context, dateTimeParameterNames.timestampName),
        date: getNestedProperty(context, dateTimeParameterNames.dateName),
        time: getNestedProperty(context, dateTimeParameterNames.timeName),
      }

      if (isDateField) {
        currentValues.date = event.value as string;
      } else if (isTimeField) {
        currentValues.time = event.value as string;
      }

      if (!currentValues.date) {
        currentValues.date = convertTimestampToReadableDate(currentValues.timestamp);
      }

      if (!currentValues.time) {
        currentValues.time = convertTimestampToReadableTime(currentValues.timestamp);
      }

      try {
        const timestamp = combineDateAndTimeToTimestamp(currentValues.date, currentValues.time);
        currentValues.timestamp = timestamp.toString();
      } catch (error) {
        currentValues.timestamp = '';
        console.log("Error combining date and time", error);
      }

      const updatedContext = rule.updateContext(
        getContext(),
        currentValues,
      );
      await onContextChanged({ context: updatedContext });
      
    };

    if (type === 'datetime') {
      userEventDispatcher.on({
        elementName: name + '_time',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId,
        handler: handleDateInputChange,
      });

      userEventDispatcher.on({
        elementName: name + '_date',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId,
        handler: handleDateInputChange,
      });
  
      acc.push({
        elementName: name + '_time',
        eventType: UserInputEventType.InputChangeEvent,
        handler: handleDateInputChange as UserEventHandler<UserInputEventType>,
      });

      acc.push({
        elementName: name + '_date',
        eventType: UserInputEventType.InputChangeEvent,
        handler: handleDateInputChange as UserEventHandler<UserInputEventType>,
      });
    } else {
      userEventDispatcher.on({
        elementName: name,
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId,
        handler: handleInputChange,
      });
  
      acc.push({
        elementName: name,
        eventType: UserInputEventType.InputChangeEvent,
        handler: handleInputChange as UserEventHandler<UserInputEventType>,
      });
    }

    if (isOptional) {
      const handleRemoveButtonClick: UserEventHandler<
        UserInputEventType.ButtonClickEvent
      > = async (_) => {
        const updatedContext = rule.updateContext(getContext(), undefined);
        await onContextChanged({ context: updatedContext });
      };
      userEventDispatcher.on({
        elementName: `${rule.name}_removeButton`,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: handleRemoveButtonClick,
      });
      acc.push({
        elementName: `${rule.name}_removeButton`,
        eventType: UserInputEventType.ButtonClickEvent,
        handler:
          handleRemoveButtonClick as UserEventHandler<UserInputEventType>,
      });
    }

    return acc;
  }, []);

  return () => {
    handlers.forEach((handler) =>
      userEventDispatcher.off({
        elementName: handler.elementName,
        eventType: handler.eventType,
        interfaceId,
        handler: handler.handler,
      }),
    );
  };
}
