import { DropdownField } from '../ui/components/DropdownField';
import { BaseContext } from '../core/types';
import { InputField } from '../ui/components/InputField';
import { UserEventDispatcher, UserEventHandler } from '../userEventDispatcher';
import { InputChangeEvent, UserInputEventType } from '@metamask/snaps-sdk';

export type RuleType = 'number' | 'text' | 'dropdown';

export type RuleDefinition<
  TContext extends BaseContext,
  TMetadata extends object,
> = {
  label: string;
  name: string;
  tooltip?: string | undefined;
  isOptional?: boolean;
  type: RuleType;
  value: (context: TContext) => string | undefined;
  error?: (metadata: TMetadata) => string | undefined;
  options?: string[];
  // todo: it would be nice if we could make the value type more specific
  updateContext: (context: TContext, value: any) => TContext;
};

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
}) {
  const value = rule.value(context);

  if (value === undefined) {
    // If the value is not set, don't render the rule
    return null;
  }

  const error = rule.error?.(metadata);
  const isDisabled = !context.isAdjustmentAllowed;
  const removeButtonName = rule.isOptional
    ? `${rule.name}_removeButton`
    : undefined;

  switch (rule.type) {
    case 'number':
    case 'text': {
      return (
        <InputField
          label={rule.label}
          name={rule.name}
          value={value}
          errorMessage={error}
          disabled={isDisabled}
          tooltip={rule.tooltip}
          type={rule.type}
          removeButtonName={removeButtonName}
        />
      );
    }
    case 'dropdown': {
      if (!rule.options) {
        //todo: type constraint on this would be nice
        throw new Error('Dropdown rule must have options');
      }

      return (
        <DropdownField
          label={rule.label}
          name={rule.name}
          options={rule.options}
          value={value}
          errorMessage={error}
          disabled={isDisabled}
          tooltip={rule.tooltip}
        />
      );
    }
  }
}

export function renderRules<
  TContext extends BaseContext,
  TMetadata extends object,
>(
  rules: RuleDefinition<TContext, TMetadata>[],
  context: TContext,
  metadata: TMetadata,
) {
  return rules.map((rule) => renderRule({ rule, context, metadata }));
}

export function bindRuleHandlers<
  TContext extends BaseContext,
  TMetadata extends object,
>({
  rules,
  userEventDispatcher,
  interfaceId,
  getContext,
  onContextChange,
}: {
  rules: RuleDefinition<TContext, TMetadata>[];
  userEventDispatcher: UserEventDispatcher;
  interfaceId: string;
  getContext: () => TContext;
  onContextChange: (args: { context: TContext }) => Promise<void>;
}): () => void {
  const handlers = rules.reduce(
    (acc, rule) => {
      const handleInputChange: UserEventHandler<
        UserInputEventType.InputChangeEvent
      > = ({ event }) => {
        const updatedContext = rule.updateContext(
          getContext(),
          (event as InputChangeEvent).value as string,
        );
        onContextChange({ context: updatedContext });
      };
      userEventDispatcher.on({
        elementName: rule.name,
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId,
        handler: handleInputChange,
      });

      acc.push({
        elementName: rule.name,
        eventType: UserInputEventType.InputChangeEvent,
        handler: handleInputChange as UserEventHandler<UserInputEventType>,
      });

      if (rule.isOptional) {
        const handleRemoveButtonClick: UserEventHandler<
          UserInputEventType.ButtonClickEvent
        > = (_) => {
          const updatedContext = rule.updateContext(getContext(), undefined);
          onContextChange({ context: updatedContext });
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
    },
    [] as {
      elementName: string;
      eventType: UserInputEventType;
      handler: UserEventHandler<UserInputEventType>;
    }[],
  );

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
