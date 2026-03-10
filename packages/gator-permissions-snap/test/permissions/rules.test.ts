import { InvalidInputError } from '@metamask/snaps-sdk';

import { TimePeriod } from '../../src/core/types';
import type { BaseContext } from '../../src/core/types';
import {
  applyExpiryRule,
  createExpiryRule,
  deriveExposureForStreamingPermission,
} from '../../src/permissions/rules';
import { timestampToISO8601 } from '../../src/utils/time';

describe('createExpiryRule', () => {
  const mockTranslateFunction = jest.fn();

  const baseRuleContext: BaseContext = {
    expiry: {
      timestamp: 1893456000, // 2030-01-01T00:00:00.000Z
    },
    isAdjustmentAllowed: false,
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
      BaseContext,
      { validationErrors: { expiryError?: string } }
    >({
      elementName: 'expiry',
      translate: mockTranslateFunction,
    });

    expect(rule.name).toBe('expiry');
    expect(rule.label).toBe('expiryLabel');
    expect(rule.type).toBe('datetime');
    expect(rule.contentWhenDisabled).toBeDefined();
    expect(rule.contentWhenDisabled?.()).toBe(
      'translation of: expiryContentWhenDisabled',
    );
  });

  it('maps context and metadata to rule data correctly', () => {
    const rule = createExpiryRule<
      BaseContext,
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
      BaseContext,
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
      BaseContext,
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
  const baseRuleContext: BaseContext = {
    expiry: {
      timestamp: 1893456000, // 2030-01-01T00:00:00.000Z
    },
    isAdjustmentAllowed: false,
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
    };
    const originalRequest: any = { rules: [existingRule] };
    const newTimestamp = 1893542400; // 2030-01-02T00:00:00.000Z

    const updated = applyExpiryRule(
      {
        ...baseRuleContext,
        expiry: { timestamp: newTimestamp },
      },
      originalRequest,
    );

    expect(updated.rules).toHaveLength(1);
    expect(updated.rules[0].data.timestamp).toBe(newTimestamp);
  });

  it('removes expiry rule when no timestamp is set but rule exists', () => {
    const existingRule = {
      type: 'expiry',
      data: { timestamp: 1111111111 },
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

describe('deriveExposureForStreamingPermission', () => {
  const decimals = 18;

  it('returns null when maxAmount is null and exposureAtExpiry cannot be computed (no expiry)', () => {
    const result = deriveExposureForStreamingPermission({
      initialAmount: 0n,
      amountPerPeriod: 1000n * 10n ** BigInt(decimals),
      timePeriod: TimePeriod.DAILY,
      startTime: 0,
      expiryTimestamp: undefined,
      maxAmount: null,
      decimals,
    });
    expect(result).toBeNull();
  });

  it('returns null when maxAmount is null and exposureAtExpiry cannot be computed (no amount per period)', () => {
    const result = deriveExposureForStreamingPermission({
      initialAmount: 0n,
      amountPerPeriod: null,
      timePeriod: TimePeriod.DAILY,
      startTime: 0,
      expiryTimestamp: 86400,
      maxAmount: null,
      decimals,
    });
    expect(result).toBeNull();
  });

  it('returns formatted maxAmount when only maxAmount is set', () => {
    const maxAmount = 10n * 10n ** BigInt(decimals);
    const result = deriveExposureForStreamingPermission({
      initialAmount: null,
      amountPerPeriod: null,
      timePeriod: TimePeriod.DAILY,
      startTime: 0,
      expiryTimestamp: undefined,
      maxAmount,
      decimals,
    });
    expect(result).toBe('10');
  });

  it('returns formatted exposureAtExpiry when expiry and amountPerPeriod set and maxAmount null', () => {
    // 1 day = 86400 seconds; amountPerPeriod = 86400 * 10^18 (1 token/sec in wei) -> amountPerSecond = 10^18
    // exposure at expiry = 0 + 86400 * 10^18 = 86400e18 -> "86400"
    const oneDaySeconds = 86400;
    const oneTokenWei = 10n ** BigInt(decimals);
    const amountPerDay = 86400n * oneTokenWei;
    const result = deriveExposureForStreamingPermission({
      initialAmount: 0n,
      amountPerPeriod: amountPerDay,
      timePeriod: TimePeriod.DAILY,
      startTime: 0,
      expiryTimestamp: oneDaySeconds,
      maxAmount: null,
      decimals,
    });
    expect(result).toBe('86400');
  });

  it('returns min of maxAmount and exposureAtExpiry when both set (maxAmount smaller)', () => {
    const oneDaySeconds = 86400;
    const oneTokenWei = 10n ** BigInt(decimals);
    const amountPerDay = 86400n * oneTokenWei;
    const maxAmount = 5n * oneTokenWei;
    const result = deriveExposureForStreamingPermission({
      initialAmount: 0n,
      amountPerPeriod: amountPerDay,
      timePeriod: TimePeriod.DAILY,
      startTime: 0,
      expiryTimestamp: oneDaySeconds,
      maxAmount,
      decimals,
    });
    expect(result).toBe('5');
  });

  it('returns min of maxAmount and exposureAtExpiry when both set (exposureAtExpiry smaller)', () => {
    const halfDaySeconds = 43200;
    const oneTokenWei = 10n ** BigInt(decimals);
    const amountPerDay = 86400n * oneTokenWei;
    const maxAmount = 100000n * oneTokenWei;
    const result = deriveExposureForStreamingPermission({
      initialAmount: 0n,
      amountPerPeriod: amountPerDay,
      timePeriod: TimePeriod.DAILY,
      startTime: 0,
      expiryTimestamp: halfDaySeconds,
      maxAmount,
      decimals,
    });
    // exposure at half day = 43200 tokens, min(100000, 43200) = 43200
    expect(result).toBe('43200');
  });

  it('includes initialAmount in exposure-at-expiry calculation', () => {
    const oneDaySeconds = 86400;
    const oneTokenWei = 10n ** BigInt(decimals);
    const initialAmount = 3n * oneTokenWei;
    const amountPerDay = 86400n * oneTokenWei;
    const result = deriveExposureForStreamingPermission({
      initialAmount,
      amountPerPeriod: amountPerDay,
      timePeriod: TimePeriod.DAILY,
      startTime: 0,
      expiryTimestamp: oneDaySeconds,
      maxAmount: null,
      decimals,
    });
    // initial 3 + 86400 over 1 day = 86403
    expect(result).toBe('86403');
  });

  it('uses zero for initialAmount when null in exposure-at-expiry', () => {
    const oneDaySeconds = 86400;
    const oneTokenWei = 10n ** BigInt(decimals);
    const amountPerDay = 86400n * oneTokenWei;
    const result = deriveExposureForStreamingPermission({
      initialAmount: null,
      amountPerPeriod: amountPerDay,
      timePeriod: TimePeriod.DAILY,
      startTime: 0,
      expiryTimestamp: oneDaySeconds,
      maxAmount: null,
      decimals,
    });
    expect(result).toBe('86400');
  });

  it('formats total exposure with given decimals', () => {
    const value = 12345n * 10n ** BigInt(decimals);
    const result = deriveExposureForStreamingPermission({
      initialAmount: null,
      amountPerPeriod: null,
      timePeriod: TimePeriod.DAILY,
      startTime: 0,
      expiryTimestamp: undefined,
      maxAmount: value,
      decimals,
    });
    expect(result).toBe('12345');
  });
});
