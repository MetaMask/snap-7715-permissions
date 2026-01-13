import { InvalidInputError } from '@metamask/snaps-sdk';

import type { BaseRuleContext } from '../../src/core/types';
import { applyExpiryRule, createExpiryRule } from '../../src/permissions/rules';
import { timestampToISO8601 } from '../../src/utils/time';

describe('createExpiryRule', () => {
  const mockTranslateFunction = jest.fn();

  const baseRuleContext: BaseRuleContext = {
    expiry: {
      timestamp: 1893456000, // 2030-01-01T00:00:00.000Z
    },
    justification: 'test justification',
    accountAddressCaip10: 'eip155:1:0x0000000000000000000000000000000000000000',
    tokenAddressCaip19:
      'eip155:1/erc20:0x0000000000000000000000000000000000000000',
    tokenMetadata: {
      decimals: 18,
      symbol: 'TST',
      iconDataBase64: null,
    },
  };

  beforeEach(() => {
    mockTranslateFunction.mockClear();
    mockTranslateFunction.mockImplementation(
      (key: string) => `translation of: ${key}`,
    );
  });

  it('returns rule definition with correct static properties', () => {
    const rule = createExpiryRule<
      BaseRuleContext,
      { validationErrors: { expiryError?: string } }
    >({
      elementName: 'expiry',
      translate: mockTranslateFunction,
    });

    expect(rule.name).toBe('expiry');
    expect(rule.label).toBe('expiryLabel');
    expect(rule.type).toBe('datetime');
  });

  it('maps context and metadata to rule data correctly', () => {
    const rule = createExpiryRule<
      BaseRuleContext,
      { validationErrors: { expiryError?: string } }
    >({
      elementName: 'expiry',
      translate: mockTranslateFunction,
    });

    const metadata = { validationErrors: { expiryError: 'Required' } };

    const data = rule.getRuleData({
      context: baseRuleContext,
      metadata,
    });

    expect(mockTranslateFunction).toHaveBeenCalledWith('expiryTooltip');

    expect(data.value).toStrictEqual(
      timestampToISO8601(baseRuleContext.expiry?.timestamp ?? 0),
    );
    expect(data.isVisible).toBe(true);
    expect(data.tooltip).toBe('translation of: expiryTooltip');
    expect(data.error).toBe('Required');
    expect(data.allowPastDate).toBe(false);
  });

  it('updates only the expiry timestamp on context', () => {
    const rule = createExpiryRule<
      BaseRuleContext,
      { validationErrors: { expiryError?: string } }
    >({
      elementName: 'expiry',
      translate: mockTranslateFunction,
    });

    const newTimestamp = 1893542400; // 2030-01-02T00:00:00.000Z
    const isoValue = timestampToISO8601(newTimestamp);

    const updated = rule.updateContext(baseRuleContext, isoValue);

    expect(updated.expiry?.timestamp).toStrictEqual(newTimestamp);
    // Ensure other top-level fields remain unchanged
    expect(updated.justification).toStrictEqual(baseRuleContext.justification);
    expect(updated.accountAddressCaip10).toStrictEqual(
      baseRuleContext.accountAddressCaip10,
    );
    expect(updated.tokenAddressCaip19).toStrictEqual(
      baseRuleContext.tokenAddressCaip19,
    );
    expect(updated.tokenMetadata).toStrictEqual(baseRuleContext.tokenMetadata);
  });

  it('throws InvalidInputError for invalid ISO 8601 value', () => {
    const rule = createExpiryRule<
      BaseRuleContext,
      { validationErrors: { expiryError?: string } }
    >({
      elementName: 'expiry',
      translate: mockTranslateFunction,
    });

    expect(() =>
      rule.updateContext(baseRuleContext, 'not-an-iso-string'),
    ).toThrow(InvalidInputError);
  });
});

describe('applyExpiryRule', () => {
  const baseRuleContext: BaseRuleContext = {
    expiry: {
      timestamp: 1893456000, // 2030-01-01T00:00:00.000Z
    },
    justification: 'test justification',
    accountAddressCaip10: 'eip155:1:0x0000000000000000000000000000000000000000',
    tokenAddressCaip19:
      'eip155:1/erc20:0x0000000000000000000000000000000000000000',
    tokenMetadata: {
      decimals: 18,
      symbol: 'TST',
      iconDataBase64: null,
    },
  };

  it('adds an expiry rule when timestamp is provided and no existing rule', () => {
    const originalRequest: any = { rules: [] };

    const updated = applyExpiryRule(baseRuleContext, originalRequest);

    expect(updated.rules).toHaveLength(1);
    expect(updated.rules[0]).toMatchObject({
      type: 'expiry',
      data: { timestamp: baseRuleContext.expiry?.timestamp },
    });
  });

  it('updates existing expiry rule timestamp when rule already exists', () => {
    const existingRule = {
      type: 'expiry',
      data: { timestamp: 1111111111 },
      isAdjustmentAllowed: false,
    };
    const originalRequest: any = { rules: [existingRule] };
    const newTimestamp = 1893542400; // 2030-01-02T00:00:00.000Z

    const updated = applyExpiryRule(
      {
        ...baseRuleContext,
        expiry: { timestamp: newTimestamp, isAdjustmentAllowed: true },
      },
      originalRequest,
    );

    expect(updated.rules).toHaveLength(1);
    expect(updated.rules[0].data.timestamp).toBe(newTimestamp);
    // ensure other properties remain untouched during update
    expect(updated.rules[0].isAdjustmentAllowed).toBe(false);
  });

  it('removes expiry rule when no timestamp is set but rule exists', () => {
    const existingRule = {
      type: 'expiry',
      data: { timestamp: 1111111111 },
      isAdjustmentAllowed: true,
    };
    const anotherRule = { type: 'other', data: { foo: 'bar' } };
    const originalRequest: any = { rules: [anotherRule, existingRule] };

    const updated = applyExpiryRule(
      {
        ...baseRuleContext,
        expiry: undefined,
      },
      originalRequest,
    );

    expect(updated.rules).toHaveLength(1);
    expect(updated.rules[0]).toStrictEqual(anotherRule);
    // ensure the expiry rule was removed
    expect(
      updated.rules.find((rule: any) => rule.type === 'expiry'),
    ).toBeUndefined();
  });

  it('leaves rules unchanged when no timestamp and no existing expiry rule', () => {
    const originalRequest: any = {
      rules: [{ type: 'other', data: { foo: 'bar' } }],
    };

    const updated = applyExpiryRule(
      {
        ...baseRuleContext,
        expiry: undefined,
      },
      originalRequest,
    );

    expect(updated.rules).toHaveLength(1);
    expect(updated.rules[0]).toStrictEqual(originalRequest.rules[0]);
  });
});
