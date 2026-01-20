import { InvalidInputError, UserInputEventType } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';

import type { BaseContext, RuleDefinition } from './types';
import { DateTimePickerField } from '../ui/components/DateTimePickerField';
import { DropdownField } from '../ui/components/DropdownField';
import { InputField } from '../ui/components/InputField';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../userEventDispatcher';
import type { MessageKey } from '../utils/i18n';
import { t } from '../utils/i18n';

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
    is7715RuleType,
    allowPastDate,
  } = rule.getRuleData({ context, metadata });

  if (!isVisible) {
    return null;
  }

  // Rules that are defined in the 7715 specification always default to disabled input, since there is no adjustment allowed as defined by ERC-7715
  // All other rules will use the isAdjustmentAllowed flag to determine if the input should be disabled.
  const isDisabled = is7715RuleType ? true : !isAdjustmentAllowed;

  const addFieldButtonName = isOptional ? `${name}_addFieldButton` : undefined;
  const removeFieldButtonName = isOptional
    ? `${name}_removeFieldButton`
    : undefined;

  switch (type) {
    case 'number':
    case 'text': {
      return (
        <InputField
          label={t(label)}
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
        throw new InvalidInputError('Dropdown rule must have options');
      }
      if (isOptional) {
        throw new InvalidInputError('Dropdown rule must not be optional');
      }

      return (
        <DropdownField
          label={t(label)}
          name={name}
          value={value as MessageKey}
          errorMessage={error}
          disabled={isDisabled}
          tooltip={tooltip}
          options={options as MessageKey[]}
        />
      );
    }
    case 'datetime': {
      return (
        <DateTimePickerField
          label={t(label)}
          name={name}
          value={value}
          errorMessage={error}
          disabled={isDisabled}
          tooltip={tooltip}
          allowPastDate={allowPastDate}
          removeFieldButtonName={removeFieldButtonName}
          addFieldButtonName={addFieldButtonName}
        />
      );
    }
    default: {
      throw new InvalidInputError(`Unknown rule type: ${type as string}`);
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
  const unbinders = rules.reduce<(() => void)[]>((acc, rule) => {
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

    // All input types (including datetime) use the same handler
    const { unbind: unbindInputChange } = userEventDispatcher.on({
      elementName: name,
      eventType: UserInputEventType.InputChangeEvent,
      interfaceId,
      handler: handleInputChange,
    });

    acc.push(unbindInputChange);

    if (isOptional) {
      const { unbind: unbindAddFieldButtonClick } = userEventDispatcher.on({
        elementName: `${rule.name}_addFieldButton`,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: async (_) => {
          const updatedContext = rule.updateContext(getContext(), '');
          await onContextChanged({ context: updatedContext });
        },
      });
      acc.push(unbindAddFieldButtonClick);

      const { unbind: unbindRemoveFieldButtonClick } = userEventDispatcher.on({
        elementName: `${rule.name}_removeFieldButton`,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId,
        handler: async (_) => {
          const updatedContext = rule.updateContext(getContext(), undefined);

          await onContextChanged({
            context: updatedContext,
          });
        },
      });

      acc.push(unbindRemoveFieldButtonClick);
    }

    return acc;
  }, []);

  return () => {
    unbinders.forEach((unbind) => unbind());
  };
}
