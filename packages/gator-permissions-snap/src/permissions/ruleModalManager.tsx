import { UserInputEventType } from '@metamask/snaps-sdk';
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

import type { BaseContext } from '../core/types';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../userEventDispatcher';
import type { RuleDefinition } from './rules';

export const TOGGLE_ADD_MORE_RULES_BUTTON = 'add-more-rules';
export const SELECT_NEW_RULE_DROPDOWN = 'select-new-rule';
export const NEW_RULE_VALUE_ELEMENT = 'new-rule-value';
export const SAVE_NEW_RULE_BUTTON = 'save-new-rule';

export class RuleModalManager<
  TContext extends BaseContext,
  TMetadata extends object,
> {
  readonly #userEventDispatcher: UserEventDispatcher;

  readonly #interfaceId: string;

  readonly #rules: RuleDefinition<TContext, TMetadata>[];

  readonly #onModalChanged: () => Promise<void>;

  readonly #onContextChanged: (args: { context: TContext }) => Promise<void>;

  readonly #getContext: () => TContext;

  readonly #deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;

  #isModalVisible = false;

  #selectedRuleIndex = 0;

  #ruleValue = '';

  #handlers: {
    elementName: string;
    eventType: UserInputEventType;
    handler: UserEventHandler<UserInputEventType>;
  }[] = [];

  constructor({
    userEventDispatcher,
    interfaceId,
    rules,
    onModalChanged,
    getContext,
    onContextChanged,
    deriveMetadata,
  }: {
    userEventDispatcher: UserEventDispatcher;
    interfaceId: string;
    rules: RuleDefinition<TContext, TMetadata>[];
    onModalChanged: () => Promise<void>;
    getContext: () => TContext;
    onContextChanged: (args: { context: TContext }) => Promise<void>;
    deriveMetadata: (args: { context: TContext }) => Promise<TMetadata>;
  }) {
    this.#userEventDispatcher = userEventDispatcher;
    this.#interfaceId = interfaceId;
    this.#rules = rules;
    this.#onModalChanged = onModalChanged;
    this.#onContextChanged = onContextChanged;
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

    const validationMessage = await this.#getValidationMessage();

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
    > = async () => {
      this.#isModalVisible = !this.#isModalVisible;
      await this.#onModalChanged();
    };

    const dropdownChangeHandler: UserEventHandler<
      UserInputEventType.InputChangeEvent
    > = async ({ event }) => {
      this.#selectedRuleIndex = parseInt(event.value as string, 10);

      await this.#onModalChanged();
    };

    const ruleValueChangeHandler: UserEventHandler<
      UserInputEventType.InputChangeEvent
    > = async ({ event }) => {
      const inputEvent = event;
      this.#ruleValue = inputEvent.value as string;

      await this.#onModalChanged();
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

        this.#ruleValue = '';
        this.#isModalVisible = false;
        this.#selectedRuleIndex = 0;

        await this.#onContextChanged({ context: updatedContext });
      }
    };

    this.#handlers = [
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

    this.#handlers.forEach((handler) =>
      this.#userEventDispatcher.on({
        elementName: handler.elementName,
        eventType: handler.eventType,
        interfaceId: this.#interfaceId,
        handler: handler.handler,
      }),
    );
  }

  unbindHandlers(): void {
    this.#handlers.forEach((handler) =>
      this.#userEventDispatcher.off({
        elementName: handler.elementName,
        eventType: handler.eventType,
        interfaceId: this.#interfaceId,
        handler: handler.handler,
      }),
    );
    this.#handlers = [];
  }

  async #getValidationMessage(): Promise<string | undefined> {
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
    return this.#isModalVisible;
  }
}
