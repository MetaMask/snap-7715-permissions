import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UserInputEventType } from '@metamask/snaps-sdk';

import { TOGGLE_ADD_MORE_RULES_BUTTON } from '../../src/core/permissionHandlerContent';
import {
  RuleModalManager,
  SELECT_NEW_RULE_DROPDOWN,
  NEW_RULE_VALUE_ELEMENT,
  SAVE_NEW_RULE_BUTTON,
} from '../../src/core/ruleModalManager';
import type { BaseContext, RuleDefinition } from '../../src/core/types';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../../src/userEventDispatcher';

type TestContext = BaseContext & {
  rule1Value?: string;
  rule2Value?: string;
  rule3Value?: string;
};

type TestMetadata = {
  validationErrors: Record<string, string>;
};

const mockContext: TestContext = {
  expiry: '2024-12-31',
  isAdjustmentAllowed: true,
  justification: 'Permission to do something important',
  rule1Value: 'existing-value',
  // rule2Value and rule3Value are intentionally omitted to test undefined behavior
};

const mockMetadata: TestMetadata = {
  validationErrors: {},
};

const rule1: RuleDefinition<TestContext, TestMetadata> = {
  name: 'rule1',
  label: 'Rule 1',
  type: 'text',
  getRuleData: ({ context }) => ({
    value: context.rule1Value,
    isVisible: true,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
  }),
  updateContext: (context, value) => ({ ...context, rule1Value: value }),
};

const rule2: RuleDefinition<TestContext, TestMetadata> = {
  name: 'rule2',
  label: 'Rule 2',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.rule2Value,
    isVisible: true,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    error: metadata.validationErrors.rule2Value,
  }),
  updateContext: (context, value) => ({ ...context, rule2Value: value }),
};

const rule3: RuleDefinition<TestContext, TestMetadata> = {
  name: 'rule3',
  label: 'Rule 3',
  type: 'text',
  getRuleData: ({ context }) => ({
    value: context.rule3Value,
    isVisible: true,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
  }),
  updateContext: (context, value) => ({ ...context, rule3Value: value }),
};

const mockRules = [rule1, rule2, rule3];

describe('RuleModalManager', () => {
  let mockUserEventDispatcher: jest.Mocked<UserEventDispatcher>;
  let mockOnModalChanged: jest.MockedFunction<() => Promise<void>>;
  let mockOnContextChanged: jest.MockedFunction<
    (args: { context: TestContext }) => Promise<void>
  >;
  let mockGetContext: jest.MockedFunction<() => TestContext>;
  let mockDeriveMetadata: jest.MockedFunction<
    (args: { context: TestContext }) => Promise<TestMetadata>
  >;
  let ruleModalManager: RuleModalManager<TestContext, TestMetadata>;

  beforeEach(() => {
    mockUserEventDispatcher = {
      on: jest.fn().mockReturnThis(),
      off: jest.fn().mockReturnThis(),
      createUserInputEventHandler: jest.fn(),
    } as unknown as jest.Mocked<UserEventDispatcher>;

    mockOnModalChanged = jest
      .fn<() => Promise<void>>()
      .mockResolvedValue(undefined);
    mockOnContextChanged = jest
      .fn<(args: { context: TestContext }) => Promise<void>>()
      .mockResolvedValue(undefined);
    mockGetContext = jest.fn<() => TestContext>().mockReturnValue(mockContext);
    mockDeriveMetadata = jest
      .fn<(args: { context: TestContext }) => Promise<TestMetadata>>()
      .mockResolvedValue(mockMetadata);

    ruleModalManager = new RuleModalManager({
      userEventDispatcher: mockUserEventDispatcher,
      interfaceId: 'test-interface',
      rules: mockRules,
      onModalChanged: mockOnModalChanged,
      getContext: mockGetContext,
      onContextChanged: mockOnContextChanged,
      deriveMetadata: mockDeriveMetadata,
    });
  });

  describe('constructor', () => {
    it('should initialize with correct default state', () => {
      expect(ruleModalManager.isModalVisible()).toBe(false);
    });
  });

  describe('hasRulesToAdd()', () => {
    it('should return true when there are rules with undefined values', () => {
      const result = ruleModalManager.hasRulesToAdd({
        context: mockContext,
        metadata: mockMetadata,
      });
      expect(result).toBe(true);
    });

    it('should return false when all rules have values', () => {
      const contextWithAllValues = {
        ...mockContext,
        rule2Value: 'value2',
        rule3Value: 'value3',
      };

      const result = ruleModalManager.hasRulesToAdd({
        context: contextWithAllValues,
        metadata: mockMetadata,
      });
      expect(result).toBe(false);
    });

    it('should return false when no rules are provided', () => {
      const emptyRuleManager = new RuleModalManager({
        userEventDispatcher: mockUserEventDispatcher,
        interfaceId: 'test-interface',
        rules: [],
        onModalChanged: mockOnModalChanged,
        getContext: mockGetContext,
        onContextChanged: mockOnContextChanged,
        deriveMetadata: mockDeriveMetadata,
      });

      const result = emptyRuleManager.hasRulesToAdd({
        context: mockContext,
        metadata: mockMetadata,
      });
      expect(result).toBe(false);
    });
  });

  describe('renderModal()', () => {
    it('should render modal with available rules', async () => {
      const result = await ruleModalManager.renderModal();

      expect(result).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": [
      {
        "key": null,
        "props": {
          "alignment": "space-between",
          "children": [
            {
              "key": null,
              "props": {
                "children": "",
              },
              "type": "Text",
            },
            {
              "key": null,
              "props": {
                "alignment": "center",
                "children": {
                  "key": null,
                  "props": {
                    "children": {
                      "key": null,
                      "props": {
                        "children": "Add more rules",
                      },
                      "type": "Bold",
                    },
                  },
                  "type": "Text",
                },
                "direction": "horizontal",
              },
              "type": "Box",
            },
            {
              "key": null,
              "props": {
                "alignment": "end",
                "children": {
                  "key": null,
                  "props": {
                    "children": {
                      "key": null,
                      "props": {
                        "color": "primary",
                        "name": "close",
                        "size": "inherit",
                      },
                      "type": "Icon",
                    },
                    "name": "add-more-rules",
                  },
                  "type": "Button",
                },
                "direction": "horizontal",
              },
              "type": "Box",
            },
          ],
          "direction": "horizontal",
        },
        "type": "Box",
      },
      {
        "key": null,
        "props": {
          "children": "Create additional rules that this permission must follow.",
        },
        "type": "Text",
      },
      {
        "key": null,
        "props": {
          "children": [
            {
              "key": null,
              "props": {
                "children": "Rule 2",
                "value": "0",
              },
              "type": "Option",
            },
            {
              "key": null,
              "props": {
                "children": "Rule 3",
                "value": "1",
              },
              "type": "Option",
            },
          ],
          "name": "select-new-rule",
        },
        "type": "Dropdown",
      },
      {
        "key": null,
        "props": {
          "children": {
            "key": null,
            "props": {
              "name": "new-rule-value",
              "type": "number",
            },
            "type": "Input",
          },
          "error": "Enter a value",
        },
        "type": "Field",
      },
      {
        "key": null,
        "props": {
          "children": "Save",
          "disabled": true,
          "name": "save-new-rule",
          "type": "submit",
        },
        "type": "Button",
      },
    ],
  },
  "type": "Section",
}
`);
    });

    it('should render modal with validation error', async () => {
      const errorMetadata = {
        validationErrors: { rule2Value: 'Invalid value' },
      };
      mockDeriveMetadata.mockResolvedValueOnce(errorMetadata);

      // Create a rule manager instance with a value set through a different approach
      const ruleManagerWithValue = new RuleModalManager({
        userEventDispatcher: mockUserEventDispatcher,
        interfaceId: 'test-interface',
        rules: mockRules,
        onModalChanged: mockOnModalChanged,
        getContext: mockGetContext,
        onContextChanged: mockOnContextChanged,
        deriveMetadata: mockDeriveMetadata,
      });

      // Bind handlers and simulate input change to set rule value
      ruleManagerWithValue.bindHandlers();
      const valueChangeCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === NEW_RULE_VALUE_ELEMENT,
      );
      const valueHandler = valueChangeCall?.[0]
        .handler as UserEventHandler<UserInputEventType.InputChangeEvent>;

      await valueHandler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: NEW_RULE_VALUE_ELEMENT,
          value: 'invalid-value',
        },
      });

      const result = await ruleManagerWithValue.renderModal();

      expect(result).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": [
      {
        "key": null,
        "props": {
          "alignment": "space-between",
          "children": [
            {
              "key": null,
              "props": {
                "children": "",
              },
              "type": "Text",
            },
            {
              "key": null,
              "props": {
                "alignment": "center",
                "children": {
                  "key": null,
                  "props": {
                    "children": {
                      "key": null,
                      "props": {
                        "children": "Add more rules",
                      },
                      "type": "Bold",
                    },
                  },
                  "type": "Text",
                },
                "direction": "horizontal",
              },
              "type": "Box",
            },
            {
              "key": null,
              "props": {
                "alignment": "end",
                "children": {
                  "key": null,
                  "props": {
                    "children": {
                      "key": null,
                      "props": {
                        "color": "primary",
                        "name": "close",
                        "size": "inherit",
                      },
                      "type": "Icon",
                    },
                    "name": "add-more-rules",
                  },
                  "type": "Button",
                },
                "direction": "horizontal",
              },
              "type": "Box",
            },
          ],
          "direction": "horizontal",
        },
        "type": "Box",
      },
      {
        "key": null,
        "props": {
          "children": "Create additional rules that this permission must follow.",
        },
        "type": "Text",
      },
      {
        "key": null,
        "props": {
          "children": [
            {
              "key": null,
              "props": {
                "children": "Rule 2",
                "value": "0",
              },
              "type": "Option",
            },
            {
              "key": null,
              "props": {
                "children": "Rule 3",
                "value": "1",
              },
              "type": "Option",
            },
          ],
          "name": "select-new-rule",
        },
        "type": "Dropdown",
      },
      {
        "key": null,
        "props": {
          "children": {
            "key": null,
            "props": {
              "name": "new-rule-value",
              "type": "number",
            },
            "type": "Input",
          },
        },
        "type": "Field",
      },
      {
        "key": null,
        "props": {
          "children": "Save",
          "disabled": false,
          "name": "save-new-rule",
          "type": "submit",
        },
        "type": "Button",
      },
    ],
  },
  "type": "Section",
}
`);

      expect(mockDeriveMetadata).toHaveBeenCalled();
    });
  });

  describe('bindHandlers()', () => {
    it('should bind all event handlers', () => {
      ruleModalManager.bindHandlers();

      expect(mockUserEventDispatcher.on).toHaveBeenCalledTimes(4);

      expect(mockUserEventDispatcher.on).toHaveBeenCalledWith({
        elementName: TOGGLE_ADD_MORE_RULES_BUTTON,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });

      expect(mockUserEventDispatcher.on).toHaveBeenCalledWith({
        elementName: SELECT_NEW_RULE_DROPDOWN,
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });

      expect(mockUserEventDispatcher.on).toHaveBeenCalledWith({
        elementName: NEW_RULE_VALUE_ELEMENT,
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });

      expect(mockUserEventDispatcher.on).toHaveBeenCalledWith({
        elementName: SAVE_NEW_RULE_BUTTON,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });
    });
  });

  describe('unbindHandlers()', () => {
    it('should unbind all event handlers', () => {
      ruleModalManager.bindHandlers();
      ruleModalManager.unbindHandlers();

      expect(mockUserEventDispatcher.off).toHaveBeenCalledTimes(4);

      expect(mockUserEventDispatcher.off).toHaveBeenCalledWith({
        elementName: TOGGLE_ADD_MORE_RULES_BUTTON,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });

      expect(mockUserEventDispatcher.off).toHaveBeenCalledWith({
        elementName: SELECT_NEW_RULE_DROPDOWN,
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });

      expect(mockUserEventDispatcher.off).toHaveBeenCalledWith({
        elementName: NEW_RULE_VALUE_ELEMENT,
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });

      expect(mockUserEventDispatcher.off).toHaveBeenCalledWith({
        elementName: SAVE_NEW_RULE_BUTTON,
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });
    });

    it('should clear handlers array after unbinding', () => {
      ruleModalManager.bindHandlers();
      ruleModalManager.unbindHandlers();

      // Calling unbind again should not call off() again since handlers array is cleared
      mockUserEventDispatcher.off.mockClear();
      ruleModalManager.unbindHandlers();

      expect(mockUserEventDispatcher.off).not.toHaveBeenCalled();
    });
  });

  describe('event handlers', () => {
    beforeEach(() => {
      ruleModalManager.bindHandlers();
    });

    it('should handle toggle add more rules button click', async () => {
      expect(ruleModalManager.isModalVisible()).toBe(false);

      // Find and call the toggle button handler
      const onCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === TOGGLE_ADD_MORE_RULES_BUTTON,
      );
      const handler = onCall?.[0]
        .handler as UserEventHandler<UserInputEventType.ButtonClickEvent>;

      await handler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.ButtonClickEvent,
          name: TOGGLE_ADD_MORE_RULES_BUTTON,
        },
      });

      expect(ruleModalManager.isModalVisible()).toBe(true);
      expect(mockOnModalChanged).toHaveBeenCalledTimes(1);

      // Toggle again
      await handler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.ButtonClickEvent,
          name: TOGGLE_ADD_MORE_RULES_BUTTON,
        },
      });

      expect(ruleModalManager.isModalVisible()).toBe(false);
      expect(mockOnModalChanged).toHaveBeenCalledTimes(2);
    });

    it('should handle dropdown selection change', async () => {
      const onCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === SELECT_NEW_RULE_DROPDOWN,
      );
      const handler = onCall?.[0]
        .handler as UserEventHandler<UserInputEventType.InputChangeEvent>;

      await handler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: SELECT_NEW_RULE_DROPDOWN,
          value: '1',
        },
      });

      expect(mockOnModalChanged).toHaveBeenCalledTimes(1);
    });

    it('should handle rule value input change', async () => {
      const onCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === NEW_RULE_VALUE_ELEMENT,
      );
      const handler = onCall?.[0]
        .handler as UserEventHandler<UserInputEventType.InputChangeEvent>;

      await handler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: NEW_RULE_VALUE_ELEMENT,
          value: 'new-rule-value',
        },
      });

      expect(mockOnModalChanged).toHaveBeenCalledTimes(1);
    });

    it('should handle save button click with valid input', async () => {
      // First set a rule value
      const valueChangeCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === NEW_RULE_VALUE_ELEMENT,
      );
      const valueHandler = valueChangeCall?.[0]
        .handler as UserEventHandler<UserInputEventType.InputChangeEvent>;

      await valueHandler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: NEW_RULE_VALUE_ELEMENT,
          value: 'new-value',
        },
      });

      // Then trigger save
      const saveCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === SAVE_NEW_RULE_BUTTON,
      );
      const saveHandler = saveCall?.[0]
        .handler as UserEventHandler<UserInputEventType.ButtonClickEvent>;

      await saveHandler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.ButtonClickEvent,
          name: SAVE_NEW_RULE_BUTTON,
        },
      });

      expect(mockGetContext).toHaveBeenCalled();
      expect(mockOnContextChanged).toHaveBeenCalledWith({
        context: { ...mockContext, rule2Value: 'new-value' },
      });
      expect(ruleModalManager.isModalVisible()).toBe(false);
    });

    it('should not save when rule value is empty', async () => {
      const saveCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === SAVE_NEW_RULE_BUTTON,
      );
      const saveHandler = saveCall?.[0]
        .handler as UserEventHandler<UserInputEventType.ButtonClickEvent>;

      await saveHandler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.ButtonClickEvent,
          name: SAVE_NEW_RULE_BUTTON,
        },
      });

      expect(mockOnContextChanged).not.toHaveBeenCalled();
      expect(ruleModalManager.isModalVisible()).toBe(false);
    });

    it('should throw error when selected rule is not found during save', async () => {
      // Set rule value
      const valueChangeCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === NEW_RULE_VALUE_ELEMENT,
      );
      const valueHandler = valueChangeCall?.[0]
        .handler as UserEventHandler<UserInputEventType.InputChangeEvent>;

      await valueHandler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: NEW_RULE_VALUE_ELEMENT,
          value: 'new-value',
        },
      });

      // Set invalid rule index
      const dropdownCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === SELECT_NEW_RULE_DROPDOWN,
      );
      const dropdownHandler = dropdownCall?.[0]
        .handler as UserEventHandler<UserInputEventType.InputChangeEvent>;

      await dropdownHandler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: SELECT_NEW_RULE_DROPDOWN,
          value: '999', // Invalid index
        },
      });

      // Try to save
      const saveCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === SAVE_NEW_RULE_BUTTON,
      );
      const saveHandler = saveCall?.[0]
        .handler as UserEventHandler<UserInputEventType.ButtonClickEvent>;

      await expect(
        saveHandler({
          interfaceId: 'test-interface',
          event: {
            type: UserInputEventType.ButtonClickEvent,
            name: SAVE_NEW_RULE_BUTTON,
          },
        }),
      ).rejects.toThrow('Rule not found');
    });
  });

  describe('isModalVisible()', () => {
    it('should return current modal visibility state', async () => {
      expect(ruleModalManager.isModalVisible()).toBe(false);

      // Change visibility through handler
      ruleModalManager.bindHandlers();
      const onCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === TOGGLE_ADD_MORE_RULES_BUTTON,
      );
      const handler = onCall?.[0]
        .handler as UserEventHandler<UserInputEventType.ButtonClickEvent>;

      await handler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.ButtonClickEvent,
          name: TOGGLE_ADD_MORE_RULES_BUTTON,
        },
      });

      expect(ruleModalManager.isModalVisible()).toBe(true);
    });
  });

  describe('validation logic', () => {
    it('should validate rule value with error function', async () => {
      const ruleWithError: RuleDefinition<TestContext, TestMetadata> = {
        name: 'rule-with-error',
        label: 'Rule with Error',
        type: 'text',
        getRuleData: ({ metadata }) => ({
          value: undefined,
          isVisible: true,
          isAdjustmentAllowed: true,
          error: metadata.validationErrors.ruleWithError,
        }),
        updateContext: (context, value) => ({
          ...context,
          ruleWithError: value,
        }),
      };

      const managerWithErrorRule = new RuleModalManager({
        userEventDispatcher: mockUserEventDispatcher,
        interfaceId: 'test-interface',
        rules: [ruleWithError],
        onModalChanged: mockOnModalChanged,
        getContext: mockGetContext,
        onContextChanged: mockOnContextChanged,
        deriveMetadata: mockDeriveMetadata,
      });

      mockDeriveMetadata.mockResolvedValueOnce({
        validationErrors: { ruleWithError: 'Custom error message' },
      });

      // Bind handlers and simulate input change to set rule value
      managerWithErrorRule.bindHandlers();
      const valueChangeCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === NEW_RULE_VALUE_ELEMENT,
      );
      const valueHandler = valueChangeCall?.[0]
        .handler as UserEventHandler<UserInputEventType.InputChangeEvent>;

      await valueHandler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: NEW_RULE_VALUE_ELEMENT,
          value: 'test-value',
        },
      });

      const result = await managerWithErrorRule.renderModal();

      expect(result).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": [
      {
        "key": null,
        "props": {
          "alignment": "space-between",
          "children": [
            {
              "key": null,
              "props": {
                "children": "",
              },
              "type": "Text",
            },
            {
              "key": null,
              "props": {
                "alignment": "center",
                "children": {
                  "key": null,
                  "props": {
                    "children": {
                      "key": null,
                      "props": {
                        "children": "Add more rules",
                      },
                      "type": "Bold",
                    },
                  },
                  "type": "Text",
                },
                "direction": "horizontal",
              },
              "type": "Box",
            },
            {
              "key": null,
              "props": {
                "alignment": "end",
                "children": {
                  "key": null,
                  "props": {
                    "children": {
                      "key": null,
                      "props": {
                        "color": "primary",
                        "name": "close",
                        "size": "inherit",
                      },
                      "type": "Icon",
                    },
                    "name": "add-more-rules",
                  },
                  "type": "Button",
                },
                "direction": "horizontal",
              },
              "type": "Box",
            },
          ],
          "direction": "horizontal",
        },
        "type": "Box",
      },
      {
        "key": null,
        "props": {
          "children": "Create additional rules that this permission must follow.",
        },
        "type": "Text",
      },
      {
        "key": null,
        "props": {
          "children": [
            {
              "key": null,
              "props": {
                "children": "Rule with Error",
                "value": "0",
              },
              "type": "Option",
            },
          ],
          "name": "select-new-rule",
        },
        "type": "Dropdown",
      },
      {
        "key": null,
        "props": {
          "children": {
            "key": null,
            "props": {
              "name": "new-rule-value",
              "type": "number",
            },
            "type": "Input",
          },
        },
        "type": "Field",
      },
      {
        "key": null,
        "props": {
          "children": "Save",
          "disabled": false,
          "name": "save-new-rule",
          "type": "submit",
        },
        "type": "Button",
      },
    ],
  },
  "type": "Section",
}
`);

      expect(mockDeriveMetadata).toHaveBeenCalledWith({
        context: { ...mockContext, ruleWithError: 'test-value' },
      });
    });

    it('should handle missing error function gracefully', async () => {
      const ruleWithoutError: RuleDefinition<TestContext, TestMetadata> = {
        name: 'rule-without-error',
        label: 'Rule without Error',
        type: 'text',
        getRuleData: () => ({
          value: undefined,
          isVisible: true,
          isAdjustmentAllowed: true,
        }),
        updateContext: (context, value) => ({
          ...context,
          ruleWithoutError: value,
        }),
      };

      const managerWithoutErrorRule = new RuleModalManager({
        userEventDispatcher: mockUserEventDispatcher,
        interfaceId: 'test-interface',
        rules: [ruleWithoutError],
        onModalChanged: mockOnModalChanged,
        getContext: mockGetContext,
        onContextChanged: mockOnContextChanged,
        deriveMetadata: mockDeriveMetadata,
      });

      // Bind handlers and simulate input change to set rule value
      managerWithoutErrorRule.bindHandlers();
      const valueChangeCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === NEW_RULE_VALUE_ELEMENT,
      );
      const valueHandler = valueChangeCall?.[0]
        .handler as UserEventHandler<UserInputEventType.InputChangeEvent>;

      await valueHandler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: NEW_RULE_VALUE_ELEMENT,
          value: 'test-value',
        },
      });

      const result = await managerWithoutErrorRule.renderModal();

      expect(mockDeriveMetadata).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
