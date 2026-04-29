/*
 This file has a collection of rules that are used across all permissions. "Rule" is probably
 not the best name, as it is used for a different purpose in the 7715 specification. For now, 
 however, we will keep it.
*/

import type {
  Permission,
  PermissionRequest,
} from '@metamask/7715-permissions-shared/types';
import { extractDescriptorName } from '@metamask/7715-permissions-shared/utils';

import { TimePeriod } from '../core/types';
import type {
  BaseContext,
  RuleDefinition,
  TypedPermissionRequest,
} from '../core/types';
import type { TranslateFunction } from '../utils/i18n';
import {
  iso8601ToTimestampIgnoreTimezone,
  TIME_PERIOD_TO_SECONDS,
  timestampToISO8601,
} from '../utils/time';
import { formatUnits } from '../utils/value';

/**
 * Parameters required to derive total exposure for a stream-style permission.
 * Total exposure is the minimum of max amount and (when expiry and rate exist)
 * initial amount + (expiry - start) * amountPerSecond.
 */
export type ExposureParams = {
  /** Initial amount (bigint), or null for zero. */
  initialAmount: bigint | null;
  /** Amount per time period (bigint), or null if no stream rate. */
  amountPerPeriod: bigint | null;
  /** Time period for amountPerPeriod. */
  timePeriod: TimePeriod;
  /** Permission start time (Unix seconds). */
  startTime: number;
  /** Expiry timestamp (Unix seconds), or undefined if no expiry. */
  expiryTimestamp: number | undefined;
  /** Max amount cap (bigint), or null if uncapped. */
  maxAmount: bigint | null;
  /** Token decimals for formatting. */
  decimals: number;
};

/**
 * Derives total exposure and returns it as a formatted string.
 * Total exposure is the smaller of maxAmount and exposure-at-expiry (when both
 * are defined); otherwise the one that is defined, or null.
 *
 * @param params - Minimum parameters to compute total exposure.
 * @returns Formatted total exposure string, or null if not determinable.
 */
export function deriveExposureForStreamingPermission(
  params: ExposureParams,
): string | null {
  const {
    initialAmount,
    amountPerPeriod,
    timePeriod,
    startTime,
    expiryTimestamp,
    maxAmount,
    decimals,
  } = params;

  let exposureAtExpiry: bigint | null = null;
  if (expiryTimestamp !== undefined && amountPerPeriod !== null) {
    const amountPerSecondBigInt =
      amountPerPeriod / TIME_PERIOD_TO_SECONDS[timePeriod];

    const elapsed = expiryTimestamp - startTime;

    if (elapsed > 0) {
      exposureAtExpiry =
        (initialAmount ?? 0n) + BigInt(elapsed) * amountPerSecondBigInt;
    } else {
      exposureAtExpiry = initialAmount ?? 0n;
    }
  }

  let totalExposure: bigint | null = null;
  if (maxAmount !== null && exposureAtExpiry !== null) {
    totalExposure = maxAmount < exposureAtExpiry ? maxAmount : exposureAtExpiry;
  } else {
    totalExposure = maxAmount ?? exposureAtExpiry ?? null;
  }

  return totalExposure === null
    ? null
    : formatUnits({ value: totalExposure, decimals });
}

export type ExpiryRuleContext = BaseContext;

/**
 * Reads allowed redeemer addresses from validated permission request rules.
 *
 * @param rules - Rules from the permission request.
 * @returns The address list, or undefined when no redeemer rule is present.
 */
export function getRedeemerAddressesFromRules(
  rules: PermissionRequest['rules'] | undefined,
): string[] | undefined {
  const rule = rules?.find(
    (permissionRule) =>
      extractDescriptorName(permissionRule.type) === 'redeemer',
  );
  const addresses = rule?.data?.addresses;
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return undefined;
  }
  return addresses as string[];
}

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
  translate,
}: {
  elementName: string;
  translate: TranslateFunction;
}): RuleDefinition<TContext, TMetadata> => {
  return {
    name: elementName,
    label: 'expiryLabel',
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
      isVisible: true,
      tooltip: translate('expiryTooltip'),
      error: metadata.validationErrors.expiryError,
      allowPastDate: false,
      // expiry rule is _always_ editable
      isEditable: true,
    }),
    updateContext: (context: TContext, value: string | undefined): TContext => {
      let expiry: { timestamp: number } | undefined;

      // We want to set the expiry if value is a date, _or_ if it's an empty
      // string. Empty string coalesces to false, so we do a type check.
      if (typeof value === 'string') {
        const timestamp =
          // this is a quirk of how add / remove works - when the field is
          // added, updateContext is called with an empty string.
          value === ''
            ? Math.floor(Date.now() / 1000) +
              Number(TIME_PERIOD_TO_SECONDS[TimePeriod.MONTHLY])
            : iso8601ToTimestampIgnoreTimezone(value);

        expiry = {
          timestamp,
        };
      }

      return {
        ...context,
        expiry,
      };
    },
    contentWhenDisabled: () => translate('expiryContentWhenDisabled'),
  };
};

export const applyExpiryRule = <
  TContext extends BaseContext,
  TPermissionRequest extends TypedPermissionRequest<Permission>,
>(
  context: TContext,
  originalRequest: TPermissionRequest,
): TPermissionRequest => {
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

/**
 * Re-applies the redeemer rule from the original dapp request so users cannot
 * remove or alter redeemer constraints via the confirmation UI.
 *
 * @param originalRequest - The request as originally sent by the dapp (source of truth for redeemer).
 * @param requestWithUpdatedRules - The request after merging user-editable rules (e.g. expiry).
 * @returns The merged request with redeemer rules stamped from `originalRequest`.
 */
export const applyRedeemerRule = <
  TPermissionRequest extends TypedPermissionRequest<Permission>,
>(
  originalRequest: TPermissionRequest,
  requestWithUpdatedRules: TPermissionRequest,
): TPermissionRequest => {
  // Search the original dapp request for the redeemer rule (source of truth).
  const redeemerRule = originalRequest.rules?.find(
    (rule) => extractDescriptorName(rule.type) === 'redeemer',
  );

  // Search the user-modified rules for an existing redeemer entry to replace or remove.
  let rules: (typeof originalRequest)['rules'] =
    requestWithUpdatedRules.rules || [];

  const existingRuleIndex = rules.findIndex(
    (rule) => extractDescriptorName(rule.type) === 'redeemer',
  );

  if (redeemerRule) {
    if (existingRuleIndex === -1) {
      rules = [...rules, redeemerRule];
    } else {
      rules = rules.map((rule, index) => {
        if (index === existingRuleIndex) {
          return redeemerRule;
        }
        return rule;
      });
    }
  } else if (existingRuleIndex !== -1) {
    rules = rules.filter((_, index) => index !== existingRuleIndex);
  }

  return {
    ...requestWithUpdatedRules,
    rules,
  };
};
