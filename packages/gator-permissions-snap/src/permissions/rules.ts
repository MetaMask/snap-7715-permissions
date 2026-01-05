/*
 This file has a collection of rules that are used across all permissions. "Rule" is probably
 not the best name, as it is used for a different purpose in the 7715 specification. For now, 
 however, we will keep it.
*/

import type { BaseContext, RuleDefinition } from '../core/types';
import { iso8601ToTimestamp, timestampToISO8601 } from '../utils/time';

export type ExpiryRuleContext = BaseContext;

export type ExpiryRuleMetadata = {
  validationErrors: {
    expiryError?: string;
  };
};

export const createExpiryRule = <
  TContext extends ExpiryRuleContext,
  TMetadata extends ExpiryRuleMetadata,
>({
  elementName,
}: {
  elementName: string;
}): RuleDefinition<TContext, TMetadata> => {
  return {
    name: elementName,
    label: 'Expiry',
    type: 'datetime',
    getRuleData: ({
      context,
      metadata,
    }: {
      context: TContext;
      metadata: TMetadata;
    }) => ({
      value: timestampToISO8601(context.expiry.timestamp),
      isAdjustmentAllowed: context.expiry.isAdjustmentAllowed,
      isVisible: true,
      tooltip: 'The expiry date of the permission.',
      error: metadata.validationErrors.expiryError,
      allowPastDate: false,
    }),
    updateContext: (context: TContext, value: string) => ({
      ...context,
      expiry: {
        ...context.expiry,
        timestamp: iso8601ToTimestamp(value),
      },
    }),
  };
};
