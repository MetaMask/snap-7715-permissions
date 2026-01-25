import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UserInputEventType } from '@metamask/snaps-sdk';

import {
  renderRule,
  renderRules,
  bindRuleHandlers,
} from '../../src/core/rules';
import type { BaseContext, RuleDefinition } from '../../src/core/types';
import type { MessageKey } from '../../src/utils/i18n';
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
  expiry: undefined,
  isAdjustmentAllowed: true,
  justification: 'Permission to do something important',
  accountAddressCaip10: 'eip155:1:0x1234567890123456789012345678901234567890',
  tokenAddressCaip19:
    'eip155:1/erc20:0x1234567890123456789012345678901234567890',
  tokenMetadata: {
    decimals: 18,
    symbol: 'ETH',
    iconDataBase64: null,
  },
  testValue: 'test-value',
  optionalValue: 'optional-value',
  numberValue: '123',
  dropdownValue: 'option1',
};

const mockMetadata: TestMetadata = {
  validationErrors: {},
};

const textRule: RuleDefinition<TestContext, TestMetadata> = {
  name: 'test-text-rule',
  label: 'Test Text Rule' as MessageKey,
  type: 'text',
  getRuleData: ({ context, metadata }) => ({
    value: context.testValue,
    isVisible: true,
    isEditable: context.isAdjustmentAllowed,
    tooltip: 'This is a test text rule',
    error: metadata.validationErrors.testValue,
  }),
  updateContext: (context, value) => ({ ...context, testValue: value }),
};

const numberRule: RuleDefinition<TestContext, TestMetadata> = {
  name: 'test-number-rule',
  label: 'Test Number Rule' as MessageKey,
  type: 'number',
  getRuleData: ({ context }) => ({
    value: context.numberValue,
    isVisible: true,
    isEditable: context.isAdjustmentAllowed,
  }),
  updateContext: (context, value) => ({ ...context, numberValue: value }),
};

const dropdownRule: RuleDefinition<TestContext, TestMetadata> = {
  name: 'test-dropdown-rule',
  label: 'Test Dropdown Rule' as MessageKey,
  type: 'dropdown',
  getRuleData: ({ context }) => ({
    value: context.dropdownValue,
    isVisible: true,
    isEditable: context.isAdjustmentAllowed,
    options: ['option1', 'option2', 'option3'],
  }),
  updateContext: (context, value) => ({ ...context, dropdownValue: value }),
};

const optionalRule: RuleDefinition<TestContext, TestMetadata> = {
  name: 'test-optional-rule',
  label: 'Test Optional Rule' as MessageKey,
  type: 'text',
  isOptional: true,
  getRuleData: ({ context }) => ({
    value: context.optionalValue,
    isVisible: true,
    isEditable: context.isAdjustmentAllowed,
  }),
  updateContext: (context, value) => ({ ...context, optionalValue: value }),
};

const undefinedValueRule: RuleDefinition<TestContext, TestMetadata> = {
  name: 'undefined-value-rule',
  label: 'Undefined Value Rule' as MessageKey,
  type: 'text',
  getRuleData: () => ({
    value: undefined,
    isVisible: true,
    isEditable: false,
  }),
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
          "children": [
            {
              "key": null,
              "props": {
                "children": null,
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
                "children": null,
              },
              "type": "Box",
            },
          ],
        },
        "type": "Field",
      },
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
          "children": [
            {
              "key": null,
              "props": {
                "children": null,
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
            {
              "key": null,
              "props": {
                "children": null,
              },
              "type": "Box",
            },
          ],
        },
        "type": "Field",
      },
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
          "children": [
            {
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
            null,
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
        },
        "type": "Field",
      },
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
                "children": {
                  "key": null,
                  "props": {
                    "children": {
                      "key": null,
                      "props": {
                        "alt": "Remove Test Optional Rule",
                        "src": "<svg width="37.5" height="21" viewBox="0 0 37.5 21" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect x="0" y="0" width="37.5" height="21" rx="10.5" fill="#3F57FF"/>

  <!-- Toggle circle (on right) -->
  <circle cx="27" cy="10.5" r="7.5" fill="white"/>
</svg>
",
                      },
                      "type": "Image",
                    },
                    "name": "test-optional-rule_removeFieldButton",
                  },
                  "type": "Button",
                },
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
          "children": [
            {
              "key": null,
              "props": {
                "children": null,
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
            {
              "key": null,
              "props": {
                "children": null,
              },
              "type": "Box",
            },
          ],
        },
        "type": "Field",
      },
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
          "children": [
            null,
            {
              "key": null,
              "props": {
                "children": "test-value",
              },
              "type": "Text",
            },
          ],
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
          "children": [
            {
              "key": null,
              "props": {
                "children": null,
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
                "children": null,
              },
              "type": "Box",
            },
          ],
          "error": "This field has an error",
        },
        "type": "Field",
      },
    ],
    "direction": "vertical",
  },
  "type": "Box",
}
`);
    });

    it('should return a field that is toggled to off when value is undefined', () => {
      const result = renderRule({
        rule: undefinedValueRule,
        context: mockContext,
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
          "alignment": "space-between",
          "children": [
            {
              "key": null,
              "props": {
                "children": [
                  {
                    "key": null,
                    "props": {
                      "children": "Undefined Value Rule",
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
          "children": [
            null,
            {
              "key": null,
              "props": {
                "children": "",
              },
              "type": "Text",
            },
          ],
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

    it('should throw error for dropdown rule without options', () => {
      const invalidDropdownRule: RuleDefinition<TestContext, TestMetadata> = {
        name: 'invalid-dropdown',
        label: 'Invalid Dropdown' as MessageKey,
        type: 'dropdown',
        getRuleData: ({ context }) => ({
          value: context.dropdownValue,
          isVisible: true,
          isEditable: true,

          // intentionally omitting options to test error handling
        }),
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

    it('should handle mix of rules with some returning a field that is toggled to off', () => {
      const rules = [textRule, undefinedValueRule, numberRule];
      const result = renderRules({
        rules,
        context: mockContext,
        metadata: mockMetadata,
      });

      expect(result).toHaveLength(3);
      expect(result[0]).not.toBeNull(); // textRule
      expect(result[1]).not.toBeNull(); // undefinedValueRule
      expect(result[2]).not.toBeNull(); // numberRule
    });

    it('should render empty array for no rules', () => {
      const result = renderRules({
        rules: [],
        context: mockContext,
        metadata: mockMetadata,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('bindRuleHandlers()', () => {
    let mockUserEventDispatcher: jest.Mocked<UserEventDispatcher>;
    let mockGetContext: jest.MockedFunction<() => TestContext>;
    let mockOnContextChanged: jest.MockedFunction<
      (args: { context: TestContext }) => Promise<void>
    >;
    let mockUnbindFunctions: jest.MockedFunction<() => void>[];

    beforeEach(() => {
      // Reset the array of mock unbind functions for each test
      mockUnbindFunctions = [];

      mockUserEventDispatcher = {
        on: jest.fn().mockImplementation(() => {
          // Create a new mock unbind function for each call to on()
          const mockUnbind = jest.fn<() => void>();
          mockUnbindFunctions.push(mockUnbind);
          return { unbind: mockUnbind, dispatcher: mockUserEventDispatcher };
        }),
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

      expect(mockUserEventDispatcher.on).toHaveBeenCalledTimes(5); // 3 input handlers + 1 add button + 1 remove button

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
        elementName: 'test-optional-rule_removeFieldButton',
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
        (call) =>
          call[0].elementName === 'test-optional-rule_removeFieldButton',
      );
      const handler = onCall?.[0]
        .handler as UserEventHandler<UserInputEventType.ButtonClickEvent>;

      // Simulate a button click event
      await handler({
        interfaceId: 'test-interface',
        event: {
          type: UserInputEventType.ButtonClickEvent,
          name: 'test-optional-rule_removeFieldButton',
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

      // Verify that the expected number of handlers were bound
      expect(mockUserEventDispatcher.on).toHaveBeenCalledTimes(4); // 2 input handlers + 1 add button + 1 remove button
      expect(mockUnbindFunctions).toHaveLength(4);

      // Call unbind
      unbind();

      // Verify that all individual unbind functions were called
      mockUnbindFunctions.forEach((mockUnbindFn) => {
        expect(mockUnbindFn).toHaveBeenCalledTimes(1);
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
      expect(mockUnbindFunctions).toHaveLength(0);

      unbind();
      // No unbind functions should be called since no handlers were bound
      expect(mockUnbindFunctions).toHaveLength(0);
    });
  });
});
