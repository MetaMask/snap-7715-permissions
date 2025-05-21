import { BaseContext } from '../core/types';
import { UserEventDispatcher, UserEventHandler } from '../userEventDispatcher';
import { InputChangeEvent, UserInputEventType } from '@metamask/snaps-sdk';

import {
  Box,
  Button,
  Text,
  Field,
  Section,
  Bold,
  Icon,
  Dropdown,
  Input,
  Option,
} from '@metamask/snaps-sdk/jsx';
import { RuleDefinition } from './rules';

export const TOGGLE_ADD_MORE_RULES_BUTTON = 'add-more-rules';
export const SELECT_NEW_RULE_DROPDOWN = 'select-new-rule';
export const NEW_RULE_VALUE_ELEMENT = 'new-rule-value';
export const SAVE_NEW_RULE_BUTTON = 'save-new-rule';

export class RuleModalManager<
  TContext extends BaseContext,
  TMetadata extends object,
> {
  #isAddRuleShown = false;
  #selectedRuleIndex = 0;
  #ruleValue = '';

  readonly #userEventDispatcher: UserEventDispatcher;
  readonly #interfaceId: string;
  readonly #rules: RuleDefinition<TContext, TMetadata>[];
  readonly #onModalChange: () => Promise<void>;
  readonly #onContextChange: (args: { context: TContext }) => Promise<void>;
  readonly #getContext: () => TContext;
  readonly #deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;

  private handlers: Array<{
    elementName: string;
    eventType: UserInputEventType;
    handler: UserEventHandler<UserInputEventType>;
  }> = [];

  constructor({
    userEventDispatcher,
    interfaceId,
    rules,
    onModalChange,
    getContext,
    onContextChange,
    deriveMetadata,
  }: {
    userEventDispatcher: UserEventDispatcher;
    interfaceId: string;
    rules: RuleDefinition<TContext, TMetadata>[];
    onModalChange: () => Promise<void>;
    getContext: () => TContext;
    onContextChange: (args: { context: TContext }) => Promise<void>;
    deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;
  }) {
    this.#userEventDispatcher = userEventDispatcher;
    this.#interfaceId = interfaceId;
    this.#rules = rules;
    this.#onModalChange = onModalChange;
    this.#onContextChange = onContextChange;
    this.#getContext = getContext;
    this.#deriveMetadata = deriveMetadata;
  }

  #getRulesToAdd({ context }: { context: TContext }) {
    return this.#rules.filter((rule) => rule.value(context) === undefined);
  }

  hasRulesToAdd(args: { context: TContext }) {
    return this.#getRulesToAdd(args).length > 0;
  }

  async renderModal() {
    const context = this.#getContext();

    const validationMessage = await this.getValidationMessage();

    const rulesToAdd = this.#getRulesToAdd({ context }).map(
      (rule) => rule.label,
    );

    return (
      <Section>
        <Box direction="horizontal" alignment="space-between">
          <Text>{''}</Text>
          <Box direction="horizontal" alignment="center">
            <Text>
              <Bold>Add more rules</Bold>
            </Text>
          </Box>
          <Box direction="horizontal" alignment="end">
            <Button name={TOGGLE_ADD_MORE_RULES_BUTTON}>
              <Icon name="close" size="inherit" color="primary" />
            </Button>
          </Box>
        </Box>
        <Text>Create additional rules that this permission must follow.</Text>
        <Dropdown name={SELECT_NEW_RULE_DROPDOWN}>
          {rulesToAdd.map((rule, ruleIndex) => (
            <Option value={ruleIndex.toString()}>{rule}</Option>
          ))}
        </Dropdown>
        <Field error={validationMessage}>
          <Input name={NEW_RULE_VALUE_ELEMENT} type="number" />
        </Field>
        <Button
          type="submit"
          name={SAVE_NEW_RULE_BUTTON}
          disabled={validationMessage !== undefined}
        >
          Save
        </Button>
      </Section>
    );
  }

  bindHandlers(): void {
    const addMoreRulesButtonClickHandler: UserEventHandler<
      UserInputEventType.ButtonClickEvent
    > = () => {
      this.#isAddRuleShown = !this.#isAddRuleShown;
      this.#onModalChange();
    };

    const dropdownChangeHandler: UserEventHandler<
      UserInputEventType.InputChangeEvent
    > = async ({ event }) => {
      // selected rule index is the index of the rule _within the array of options_.
      this.#selectedRuleIndex = parseInt(event.value as string);

      this.#onModalChange();
    };

    const ruleValueChangeHandler: UserEventHandler<
      UserInputEventType.InputChangeEvent
    > = async ({ event }) => {
      const inputEvent = event as InputChangeEvent;
      this.#ruleValue = inputEvent.value as string;

      this.#onModalChange();
    };

    const saveButtonHandler: UserEventHandler<
      UserInputEventType.FormSubmitEvent
    > = async () => {
      if (this.#ruleValue) {
        const context = this.#getContext();
        const selectedRule = this.#getRulesToAdd({ context })[
          this.#selectedRuleIndex
        ];

        if (selectedRule === undefined) {
          throw new Error('Rule not found');
        }

        // Update context with the new value
        const updatedContext = selectedRule.updateContext(
          context,
          this.#ruleValue,
        );
        this.#onContextChange({ context: updatedContext });

        this.#ruleValue = '';
        this.#isAddRuleShown = false;
        this.#selectedRuleIndex = 0;

        this.#onModalChange();
      }
    };

    this.handlers = [
      {
        elementName: TOGGLE_ADD_MORE_RULES_BUTTON,
        eventType: UserInputEventType.ButtonClickEvent,
        handler:
          addMoreRulesButtonClickHandler as UserEventHandler<UserInputEventType>,
      },
      {
        elementName: SELECT_NEW_RULE_DROPDOWN,
        eventType: UserInputEventType.InputChangeEvent,
        handler: dropdownChangeHandler as UserEventHandler<UserInputEventType>,
      },
      {
        elementName: NEW_RULE_VALUE_ELEMENT,
        eventType: UserInputEventType.InputChangeEvent,
        handler: ruleValueChangeHandler as UserEventHandler<UserInputEventType>,
      },
      {
        elementName: SAVE_NEW_RULE_BUTTON,
        eventType: UserInputEventType.ButtonClickEvent,
        handler: saveButtonHandler as UserEventHandler<UserInputEventType>,
      },
    ];

    this.handlers.forEach((handler) =>
      this.#userEventDispatcher.on({
        elementName: handler.elementName,
        eventType: handler.eventType,
        interfaceId: this.#interfaceId,
        handler: handler.handler,
      }),
    );
  }

  unbindHandlers(): void {
    this.handlers.forEach((handler) =>
      this.#userEventDispatcher.off({
        elementName: handler.elementName,
        eventType: handler.eventType,
        interfaceId: this.#interfaceId,
        handler: handler.handler,
      }),
    );
    this.handlers = [];
  }

  private async getValidationMessage(): Promise<string | undefined> {
    if (!this.#ruleValue) {
      return 'Enter a value';
    }

    const originalContext = this.#getContext();

    const selectedRule = this.#rules.filter(
      (rule) => rule.value(originalContext) === undefined,
    )[this.#selectedRuleIndex];

    if (selectedRule === undefined) {
      throw new Error('Rule not found');
    }

    const updatedContext = selectedRule.updateContext(
      originalContext,
      this.#ruleValue,
    );
    const metadata = await this.#deriveMetadata({ context: updatedContext });
    const error = selectedRule.error?.(metadata);

    return error;
  }

  isModalVisible(): boolean {
    return this.#isAddRuleShown;
  }
}
