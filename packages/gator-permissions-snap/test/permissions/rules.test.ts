import { InvalidInputError } from '@metamask/snaps-sdk';
import { createExpiryRule } from '../../src/permissions/rules';
import type { BaseContext } from '../../src/core/types';
import { timestampToISO8601 } from '../../src/utils/time';

describe('createExpiryRule', () => {
  const baseContext: BaseContext = {
    expiry: {
      timestamp: 1893456000, // 2030-01-01T00:00:00.000Z
      isAdjustmentAllowed: true,
    },
    isAdjustmentAllowed: true,
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

  it('returns rule definition with correct static properties', () => {
    const rule = createExpiryRule<
      BaseContext,
      { validationErrors: { expiryError?: string } }
    >({
      elementName: 'expiry',
    });

    expect(rule.name).toEqual('expiry');
    expect(rule.label).toEqual('Expiry');
    expect(rule.type).toEqual('datetime');
  });

  it('maps context and metadata to rule data correctly', () => {
    const rule = createExpiryRule<
      BaseContext,
      { validationErrors: { expiryError?: string } }
    >({
      elementName: 'expiry',
    });

    const metadata = { validationErrors: { expiryError: 'Required' } };

    const data = rule.getRuleData({
      context: baseContext,
      metadata,
    });

    expect(data.value).toEqual(
      timestampToISO8601(baseContext.expiry.timestamp),
    );
    expect(data.isAdjustmentAllowed).toEqual(
      baseContext.expiry.isAdjustmentAllowed,
    );
    expect(data.isVisible).toEqual(true);
    expect(data.tooltip).toEqual('The expiry date of the permission.');
    expect(data.error).toEqual('Required');
    expect(data.allowPastDate).toEqual(false);
  });

  it('updates only the expiry timestamp on context', () => {
    const rule = createExpiryRule<
      BaseContext,
      { validationErrors: { expiryError?: string } }
    >({
      elementName: 'expiry',
    });

    const newTimestamp = 1893542400; // 2030-01-02T00:00:00.000Z
    const isoValue = timestampToISO8601(newTimestamp);

    const updated = rule.updateContext(baseContext, isoValue);

    expect(updated.expiry.timestamp).toEqual(newTimestamp);
    expect(updated.expiry.isAdjustmentAllowed).toEqual(
      baseContext.expiry.isAdjustmentAllowed,
    );
    // Ensure other top-level fields remain unchanged
    expect(updated.isAdjustmentAllowed).toEqual(
      baseContext.isAdjustmentAllowed,
    );
    expect(updated.justification).toEqual(baseContext.justification);
    expect(updated.accountAddressCaip10).toEqual(
      baseContext.accountAddressCaip10,
    );
    expect(updated.tokenAddressCaip19).toEqual(baseContext.tokenAddressCaip19);
    expect(updated.tokenMetadata).toEqual(baseContext.tokenMetadata);
  });

  it('throws InvalidInputError for invalid ISO 8601 value', () => {
    const rule = createExpiryRule<
      BaseContext,
      { validationErrors: { expiryError?: string } }
    >({
      elementName: 'expiry',
    });

    expect(() => rule.updateContext(baseContext, 'not-an-iso-string')).toThrow(
      InvalidInputError,
    );
  });
});
