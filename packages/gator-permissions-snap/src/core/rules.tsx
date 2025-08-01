import { UserInputEventType } from '@metamask/snaps-sdk';
import { type SnapElement } from '@metamask/snaps-sdk/jsx';

import { DropdownField } from '../ui/components/DropdownField';
import { InputField } from '../ui/components/InputField';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../userEventDispatcher';
import type { BaseContext, RuleDefinition } from './types';

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
}): SnapElement | null {
  const { label, type, name, isOptional } = rule;
  const {
    value,
    error,
    tooltip,
    iconData,
    isVisible,
    options,
    isAdjustmentAllowed,
  } = rule.getRuleData({ context, metadata });

  if (!isVisible) {
    return null;
  }

  const isDisabled = !isAdjustmentAllowed;

  const addFieldButtonName = isOptional ? `${name}_addFieldButton` : undefined;
  const removeFieldButtonName = isOptional
    ? `${name}_removeFieldButton`
    : undefined;

  switch (type) {
    case 'number':
    case 'text': {
      return (
        <InputField
          label={label}
          name={name}
          value={value}
          errorMessage={error}
          disabled={isDisabled}
          tooltip={tooltip}
          type={type}
          addFieldButtonName={addFieldButtonName}
          removeFieldButtonName={removeFieldButtonName}
          iconData={iconData}
        />
      );
    }
    case 'dropdown': {
      if (!options) {
        // todo: type constraint on this would be nice
        throw new Error('Dropdown rule must have options');
      }
      if (isOptional) {
        throw new Error('Dropdown rule must not be optional');
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
}): (SnapElement | null)[] {
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
  onContextChanged,
}: {
  rules: RuleDefinition<TContext, TMetadata>[];
  userEventDispatcher: UserEventDispatcher;
  interfaceId: string;
  getContext: () => TContext;
  onContextChanged: (args: { context: TContext }) => Promise<void>;
}): () => void {
  const handlers = rules.reduce<
    {
      elementName: string;
      eventType: UserInputEventType;
      handler: UserEventHandler<UserInputEventType>;
    }[]
  >((acc, rule) => {
    const { name, isOptional } = rule;

    const handleInputChange: UserEventHandler<
      UserInputEventType.InputChangeEvent
    > = async ({ event }) => {
      const updatedContext = rule.updateContext(
        getContext(),
        event.value as string,
      );
      await onContextChanged({ context: updatedContext });
    };
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

    if (isOptional) {
      const handleAddFieldButtonClick: UserEventHandler<
        UserInputEventType.ButtonClickEvent
      > = async (_) => {
        const updatedContext = rule.updateContext(getContext(), '');
        await onContextChanged({ context: updatedContext });
      };
      userEventDispatcher.on({
        elementName: `${rule.name}_addFieldButton`,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: handleAddFieldButtonClick,
      });
      acc.push({
        elementName: `${rule.name}_addFieldButton`,
        eventType: UserInputEventType.ButtonClickEvent,
        handler:
          handleAddFieldButtonClick as UserEventHandler<UserInputEventType>,
      });

      const handleRemoveFieldButtonClick: UserEventHandler<
        UserInputEventType.ButtonClickEvent
      > = async (_) => {
        const updatedContext = rule.updateContext(getContext(), undefined);

        await onContextChanged({
          context: updatedContext,
        });
      };
      userEventDispatcher.on({
        elementName: `${rule.name}_removeFieldButton`,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: handleRemoveFieldButtonClick,
      });
      acc.push({
        elementName: `${rule.name}_removeFieldButton`,
        eventType: UserInputEventType.ButtonClickEvent,
        handler:
          handleRemoveFieldButtonClick as UserEventHandler<UserInputEventType>,
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
