/*
 This file has a collection of rules that are used across all permissions. "Rule" is probably
 not the best name, as it is used for a different purpose in the 7715 specification. For now, 
 however, we will keep it.
*/

import type { Permission } from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';

import {
  TimePeriod,
  type BaseContext,
  type RuleDefinition,
  type TypedPermissionRequest,
} from '../core/types';
import {
  iso8601ToTimestamp,
  TIME_PERIOD_TO_SECONDS,
  timestampToISO8601,
} from '../utils/time';

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
    isOptional: true,
    getRuleData: ({
      context,
      metadata,
    }: {
      context: TContext;
      metadata: TMetadata;
    }) => ({
      value: context.expiry
        ? timestampToISO8601(context.expiry.timestamp)
        : undefined,
      isAdjustmentAllowed: context.expiry?.isAdjustmentAllowed ?? true,
      isVisible: true,
      tooltip: 'The expiry date of the permission.',
      error: metadata.validationErrors.expiryError,
      allowPastDate: false,
    }),
    updateContext: (context: TContext, value: string) => {
      let expiry:
        | { timestamp: number; isAdjustmentAllowed: boolean }
        | undefined;

      // We want to set the expiry if value is a date, _or_ if it's an empty
      // string. Empty string coalesces to false, so we do a type check.
      if (typeof value === 'string') {
        const timestamp =
          // this is a quirk of how add / remove works - when the field is
          // added, updateContext is called with an empty string.
          value === ''
            ? Math.floor(Date.now() / 1000) +
              Number(TIME_PERIOD_TO_SECONDS[TimePeriod.MONTHLY])
            : iso8601ToTimestamp(value);

        expiry = {
          timestamp,
          // if the expiry is being modified, then adjustment is allowed
          isAdjustmentAllowed: true,
        };
      }

      return {
        ...context,
        expiry,
      };
    },
  };
};

export const applyExpiryRule = <
  TContext extends BaseContext,
  TPermissionRequest extends TypedPermissionRequest<Permission>,
>(
  context: TContext,
  originalRequest: TPermissionRequest,
) => {
  const expiryTimestamp = context.expiry?.timestamp;

  let rules: (typeof originalRequest)['rules'] = originalRequest.rules || [];

  const existingRuleIndex = rules.findIndex(
    (rule) => extractDescriptorName(rule.type) === 'expiry',
  );

  if (expiryTimestamp) {
    if (existingRuleIndex === -1) {
      rules = [
        ...rules,
        {
          type: 'expiry',
          data: { timestamp: expiryTimestamp },
          isAdjustmentAllowed: true,
        },
      ];
    } else {
      rules = rules.map((rule, index) => {
        if (index === existingRuleIndex) {
          return {
            ...rule,
            data: { ...rule.data, timestamp: expiryTimestamp },
          };
        }
        return rule;
      });
    }
  } else if (existingRuleIndex !== -1) {
    rules = rules.filter((_, index) => index !== existingRuleIndex);
  }

  return {
    ...originalRequest,
    rules,
  };
};
