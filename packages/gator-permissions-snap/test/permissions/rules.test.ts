import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UserInputEventType } from '@metamask/snaps-sdk';

import type { BaseContext } from '../../src/core/types';
import {
  renderRule,
  renderRules,
  bindRuleHandlers,
  type RuleDefinition,
} from '../../src/permissions/rules';
import type {
  UserEventDispatcher,
  UserEventHandler,
} from '../../src/userEventDispatcher';

type TestContext = BaseContext & {
  testValue?: string;
  optionalValue?: string;
  numberValue?: string;
  dropdownValue?: string;
};

type TestMetadata = {
  validationErrors: Record<string, string>;
};

const mockContext: TestContext = {
  expiry: '2024-12-31',
  isAdjustmentAllowed: true,
  testValue: 'test-value',
  optionalValue: 'optional-value',
  numberValue: '123',
  dropdownValue: 'option1',
};

const mockMetadata: TestMetadata = {
  validationErrors: {},
};

const textRule: RuleDefinition<TestContext, TestMetadata> = {
  label: 'Test Text Rule',
  name: 'test-text-rule',
  tooltip: 'This is a test text rule',
  type: 'text',
  value: (context) => context.testValue,
  error: (metadata) => metadata.validationErrors.testValue,
  updateContext: (context, value) => ({ ...context, testValue: value }),
};

const numberRule: RuleDefinition<TestContext, TestMetadata> = {
  label: 'Test Number Rule',
  name: 'test-number-rule',
  type: 'number',
  value: (context) => context.numberValue,
  updateContext: (context, value) => ({ ...context, numberValue: value }),
};

const dropdownRule: RuleDefinition<TestContext, TestMetadata> = {
  label: 'Test Dropdown Rule',
  name: 'test-dropdown-rule',
  type: 'dropdown',
  options: ['option1', 'option2', 'option3'],
  value: (context) => context.dropdownValue,
  updateContext: (context, value) => ({ ...context, dropdownValue: value }),
};

const optionalRule: RuleDefinition<TestContext, TestMetadata> = {
  label: 'Test Optional Rule',
  name: 'test-optional-rule',
  type: 'text',
  isOptional: true,
  value: (context) => context.optionalValue,
  updateContext: (context, value) => ({ ...context, optionalValue: value }),
};

const undefinedValueRule: RuleDefinition<TestContext, TestMetadata> = {
  label: 'Undefined Value Rule',
  name: 'undefined-value-rule',
  type: 'text',
  value: () => undefined,
  updateContext: (context, value) => ({ ...context, testValue: value }),
};

describe('rules', () => {
  describe('renderRule()', () => {
    it('should render a text input rule', () => {
      const result = renderRule({
        rule: textRule,
        context: mockContext,
        metadata: mockMetadata,
      });

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
                "children": [
                  {
                    "key": null,
                    "props": {
                      "children": "Test Text Rule",
                    },
                    "type": "Text",
                  },
                  {
                    "key": null,
                    "props": {
                      "children": {
                        "key": null,
                        "props": {
                          "color": "muted",
                          "name": "question",
                          "size": "inherit",
                        },
                        "type": "Icon",
                      },
                      "content": {
                        "key": null,
                        "props": {
                          "children": "This is a test text rule",
                        },
                        "type": "Text",
                      },
                    },
                    "type": "Tooltip",
                  },
                ],
                "direction": "horizontal",
              },
              "type": "Box",
            },
            null,
          ],
          "direction": "horizontal",
        },
        "type": "Box",
      },
      {
        "key": null,
        "props": {
          "name": "test-text-rule",
          "type": "text",
          "value": "test-value",
        },
        "type": "Input",
      },
      null,
    ],
    "direction": "vertical",
  },
  "type": "Box",
}
`);
    });

    it('should render a number input rule', () => {
      const result = renderRule({
        rule: numberRule,
        context: mockContext,
        metadata: mockMetadata,
      });

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
                "children": [
                  {
                    "key": null,
                    "props": {
                      "children": "Test Number Rule",
                    },
                    "type": "Text",
                  },
                  null,
                ],
                "direction": "horizontal",
              },
              "type": "Box",
            },
            null,
          ],
          "direction": "horizontal",
        },
        "type": "Box",
      },
      {
        "key": null,
        "props": {
          "name": "test-number-rule",
          "type": "number",
          "value": "123",
        },
        "type": "Input",
      },
      null,
    ],
    "direction": "vertical",
  },
  "type": "Box",
}
`);
    });

    it('should render a dropdown rule', () => {
      const result = renderRule({
        rule: dropdownRule,
        context: mockContext,
        metadata: mockMetadata,
      });

      expect(result).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "children": [
      {
        "key": null,
        "props": {
          "alignment": "space-between",
          "children": {
            "key": null,
            "props": {
              "children": [
                {
                  "key": null,
                  "props": {
                    "children": "Test Dropdown Rule",
                  },
                  "type": "Text",
                },
                null,
              ],
              "direction": "horizontal",
            },
            "type": "Box",
          },
          "direction": "horizontal",
        },
        "type": "Box",
      },
      {
        "key": null,
        "props": {
          "children": [
            {
              "key": "option1",
              "props": {
                "children": "option1",
                "value": "option1",
              },
              "type": "Option",
            },
            {
              "key": "option2",
              "props": {
                "children": "option2",
                "value": "option2",
              },
              "type": "Option",
            },
            {
              "key": "option3",
              "props": {
                "children": "option3",
                "value": "option3",
              },
              "type": "Option",
            },
          ],
          "name": "test-dropdown-rule",
          "value": "option1",
        },
        "type": "Dropdown",
      },
      null,
    ],
    "direction": "vertical",
  },
  "type": "Box",
}
`);
    });

    it('should render an optional rule with remove button', () => {
      const result = renderRule({
        rule: optionalRule,
        context: mockContext,
        metadata: mockMetadata,
      });

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
                "children": [
                  {
                    "key": null,
                    "props": {
                      "children": "Test Optional Rule",
                    },
                    "type": "Text",
                  },
                  null,
                ],
                "direction": "horizontal",
              },
              "type": "Box",
            },
            {
              "key": null,
              "props": {
                "children": "Remove",
                "name": "test-optional-rule_removeButton",
                "type": "button",
              },
              "type": "Button",
            },
          ],
          "direction": "horizontal",
        },
        "type": "Box",
      },
      {
        "key": null,
        "props": {
          "name": "test-optional-rule",
          "type": "text",
          "value": "optional-value",
        },
        "type": "Input",
      },
      null,
    ],
    "direction": "vertical",
  },
  "type": "Box",
}
`);
    });

    it('should render disabled fields when adjustment is not allowed', () => {
      const disabledContext = { ...mockContext, isAdjustmentAllowed: false };
      const result = renderRule({
        rule: textRule,
        context: disabledContext,
        metadata: mockMetadata,
      });

      expect(result).toMatchInlineSnapshot(`
{
  "key": null,
  "props": {
    "alignment": "space-between",
    "children": [
      {
        "key": null,
        "props": {
          "children": [
            {
              "key": null,
              "props": {
                "children": "Test Text Rule",
              },
              "type": "Text",
            },
            {
              "key": null,
              "props": {
                "children": {
                  "key": null,
                  "props": {
                    "color": "muted",
                    "name": "question",
                    "size": "inherit",
                  },
                  "type": "Icon",
                },
                "content": {
                  "key": null,
                  "props": {
                    "children": "This is a test text rule",
                  },
                  "type": "Text",
                },
              },
              "type": "Tooltip",
            },
          ],
          "direction": "horizontal",
        },
        "type": "Box",
      },
      {
        "key": null,
        "props": {
          "children": {
            "key": null,
            "props": {
              "children": "test-value",
            },
            "type": "Text",
          },
          "direction": "horizontal",
        },
        "type": "Box",
      },
    ],
    "direction": "horizontal",
  },
  "type": "Box",
}
`);
    });

    it('should render with error message', () => {
      const errorMetadata = {
        validationErrors: { testValue: 'This field has an error' },
      };
      const result = renderRule({
        rule: textRule,
        context: mockContext,
        metadata: errorMetadata,
      });

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
                "children": [
                  {
                    "key": null,
                    "props": {
                      "children": "Test Text Rule",
                    },
                    "type": "Text",
                  },
                  {
                    "key": null,
                    "props": {
                      "children": {
                        "key": null,
                        "props": {
                          "color": "muted",
                          "name": "question",
                          "size": "inherit",
                        },
                        "type": "Icon",
                      },
                      "content": {
                        "key": null,
                        "props": {
                          "children": "This is a test text rule",
                        },
                        "type": "Text",
                      },
                    },
                    "type": "Tooltip",
                  },
                ],
                "direction": "horizontal",
              },
              "type": "Box",
            },
            null,
          ],
          "direction": "horizontal",
        },
        "type": "Box",
      },
      {
        "key": null,
        "props": {
          "name": "test-text-rule",
          "type": "text",
          "value": "test-value",
        },
        "type": "Input",
      },
      {
        "key": null,
        "props": {
          "children": "This field has an error",
          "color": "error",
        },
        "type": "Text",
      },
    ],
    "direction": "vertical",
  },
  "type": "Box",
}
`);
    });

    it('should return null when value is undefined', () => {
      const result = renderRule({
        rule: undefinedValueRule,
        context: mockContext,
        metadata: mockMetadata,
      });

      expect(result).toBeNull();
    });

    it('should throw error for dropdown rule without options', () => {
      const invalidDropdownRule: RuleDefinition<TestContext, TestMetadata> = {
        label: 'Invalid Dropdown',
        name: 'invalid-dropdown',
        type: 'dropdown',
        value: (context) => context.dropdownValue,
        updateContext: (context, value) => ({
          ...context,
          dropdownValue: value,
        }),
      };

      expect(() =>
        renderRule({
          rule: invalidDropdownRule,
          context: mockContext,
          metadata: mockMetadata,
        }),
      ).toThrow('Dropdown rule must have options');
    });

    it('should throw error for unknown rule type', () => {
      const unknownRule = {
        ...textRule,
        type: 'unknown' as any,
      };

      expect(() =>
        renderRule({
          rule: unknownRule,
          context: mockContext,
          metadata: mockMetadata,
        }),
      ).toThrow('Unknown rule type: unknown');
    });
  });

  describe('renderRules()', () => {
    it('should render multiple rules', () => {
      const rules = [textRule, numberRule, dropdownRule];
      const result = renderRules({
        rules,
        context: mockContext,
        metadata: mockMetadata,
      });

      expect(result).toHaveLength(3);
      expect(result[0]).not.toBeNull();
      expect(result[1]).not.toBeNull();
      expect(result[2]).not.toBeNull();
    });

    it('should handle mix of rules with some returning null', () => {
      const rules = [textRule, undefinedValueRule, numberRule];
      const result = renderRules({
        rules,
        context: mockContext,
        metadata: mockMetadata,
      });

      expect(result).toHaveLength(3);
      expect(result[0]).not.toBeNull(); // textRule
      expect(result[1]).toBeNull(); // undefinedValueRule
      expect(result[2]).not.toBeNull(); // numberRule
    });

    it('should render empty array for no rules', () => {
      const result = renderRules({
        rules: [],
        context: mockContext,
        metadata: mockMetadata,
      });

      expect(result).toEqual([]);
    });
  });

  describe('bindRuleHandlers()', () => {
    let mockUserEventDispatcher: jest.Mocked<UserEventDispatcher>;
    let mockGetContext: jest.MockedFunction<() => TestContext>;
    let mockOnContextChanged: jest.MockedFunction<
      (args: { context: TestContext }) => Promise<void>
    >;

    beforeEach(() => {
      mockUserEventDispatcher = {
        on: jest.fn().mockReturnThis(),
        off: jest.fn().mockReturnThis(),
        createUserInputEventHandler: jest.fn(),
      } as unknown as jest.Mocked<UserEventDispatcher>;

      mockGetContext = jest
        .fn<() => TestContext>()
        .mockReturnValue(mockContext);
      mockOnContextChanged = jest
        .fn<(args: { context: TestContext }) => Promise<void>>()
        .mockResolvedValue(undefined);
    });

    it('should bind input change handlers for all rules', () => {
      const rules = [textRule, numberRule, optionalRule];

      bindRuleHandlers({
        rules,
        userEventDispatcher: mockUserEventDispatcher,
        interfaceId: 'test-interface',
        getContext: mockGetContext,
        onContextChanged: mockOnContextChanged,
      });

      expect(mockUserEventDispatcher.on).toHaveBeenCalledTimes(4); // 3 input handlers + 1 remove button

      // Check input change handlers
      expect(mockUserEventDispatcher.on).toHaveBeenCalledWith({
        elementName: 'test-text-rule',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });

      expect(mockUserEventDispatcher.on).toHaveBeenCalledWith({
        elementName: 'test-number-rule',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });

      expect(mockUserEventDispatcher.on).toHaveBeenCalledWith({
        elementName: 'test-optional-rule',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });
    });

    it('should bind remove button handlers for optional rules', () => {
      const rules = [optionalRule];

      bindRuleHandlers({
        rules,
        userEventDispatcher: mockUserEventDispatcher,
        interfaceId: 'test-interface',
        getContext: mockGetContext,
        onContextChanged: mockOnContextChanged,
      });

      expect(mockUserEventDispatcher.on).toHaveBeenCalledWith({
        elementName: 'test-optional-rule_removeButton',
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });
    });

    it('should handle input change events correctly', async () => {
      const rules = [textRule];

      bindRuleHandlers({
        rules,
        userEventDispatcher: mockUserEventDispatcher,
        interfaceId: 'test-interface',
        getContext: mockGetContext,
        onContextChanged: mockOnContextChanged,
      });

      // Get the handler that was bound
      const onCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === 'test-text-rule',
      );
      const handler = onCall?.[0]
        .handler as UserEventHandler<UserInputEventType.InputChangeEvent>;

      // Simulate an input change event
      await handler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.InputChangeEvent,
          name: 'test-text-rule',
          value: 'new-value',
        },
      });

      expect(mockGetContext).toHaveBeenCalled();
      expect(mockOnContextChanged).toHaveBeenCalledWith({
        context: { ...mockContext, testValue: 'new-value' },
      });
    });

    it('should handle remove button click events correctly', async () => {
      const rules = [optionalRule];

      bindRuleHandlers({
        rules,
        userEventDispatcher: mockUserEventDispatcher,
        interfaceId: 'test-interface',
        getContext: mockGetContext,
        onContextChanged: mockOnContextChanged,
      });

      // Get the remove button handler
      const onCall = mockUserEventDispatcher.on.mock.calls.find(
        (call) => call[0].elementName === 'test-optional-rule_removeButton',
      );
      const handler = onCall?.[0]
        .handler as UserEventHandler<UserInputEventType.ButtonClickEvent>;

      // Simulate a button click event
      await handler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.ButtonClickEvent,
          name: 'test-optional-rule_removeButton',
        },
      });

      expect(mockGetContext).toHaveBeenCalled();
      expect(mockOnContextChanged).toHaveBeenCalledWith({
        context: { ...mockContext, optionalValue: undefined },
      });
    });

    it('should return unbind function that removes all handlers', () => {
      const rules = [textRule, optionalRule];

      const unbind = bindRuleHandlers({
        rules,
        userEventDispatcher: mockUserEventDispatcher,
        interfaceId: 'test-interface',
        getContext: mockGetContext,
        onContextChanged: mockOnContextChanged,
      });

      expect(typeof unbind).toBe('function');

      // Call unbind
      unbind();

      expect(mockUserEventDispatcher.off).toHaveBeenCalledTimes(3); // 2 input handlers + 1 remove button

      expect(mockUserEventDispatcher.off).toHaveBeenCalledWith({
        elementName: 'test-text-rule',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });

      expect(mockUserEventDispatcher.off).toHaveBeenCalledWith({
        elementName: 'test-optional-rule',
        eventType: UserInputEventType.InputChangeEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });

      expect(mockUserEventDispatcher.off).toHaveBeenCalledWith({
        elementName: 'test-optional-rule_removeButton',
        eventType: UserInputEventType.ButtonClickEvent,
        interfaceId: 'test-interface',
        handler: expect.any(Function),
      });
    });

    it('should handle empty rules array', () => {
      const unbind = bindRuleHandlers({
        rules: [],
        userEventDispatcher: mockUserEventDispatcher,
        interfaceId: 'test-interface',
        getContext: mockGetContext,
        onContextChanged: mockOnContextChanged,
      });

      expect(mockUserEventDispatcher.on).not.toHaveBeenCalled();

      unbind();
      expect(mockUserEventDispatcher.off).not.toHaveBeenCalled();
    });
  });
});
