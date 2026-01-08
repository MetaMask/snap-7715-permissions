import { InvalidInputError } from '@metamask/snaps-sdk';

import type { RuleDefinition } from '../../core/types';
import { TimePeriod } from '../../core/types';
import {
  getClosestTimePeriod,
  TIME_PERIOD_TO_SECONDS,
  timestampToISO8601,
  iso8601ToTimestamp,
} from '../../utils/time';
import { getIconData } from '../iconUtil';
import type {
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
} from './types';
import { createExpiryRule } from '../rules';
import { t } from '../../utils/i18n';

export const PERIOD_AMOUNT_ELEMENT = 'native-token-periodic-period-amount';
export const PERIOD_TYPE_ELEMENT = 'native-token-periodic-period-type';
export const START_TIME_ELEMENT = 'native-token-periodic-start-date';
export const EXPIRY_ELEMENT = 'native-token-periodic-expiry';

export const periodAmountRule: RuleDefinition<
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata
> = {
  name: PERIOD_AMOUNT_ELEMENT,
  label: 'amountLabel',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.periodAmount,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: t('amountTooltip'),
    error: metadata.validationErrors.periodAmountError,
    iconData: getIconData(context),
  }),
  updateContext: (context: NativeTokenPeriodicContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      periodAmount: value,
    },
  }),
};

export const periodDurationRule: RuleDefinition<
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata
> = {
  name: PERIOD_TYPE_ELEMENT,
  label: 'periodDurationLabel',
  type: 'dropdown',
  getRuleData: ({ context, metadata }) => ({
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    value: getClosestTimePeriod(context.permissionDetails.periodDuration),
    isVisible: true,
    tooltip: t('periodDurationTooltip'),
    options: Object.values(TimePeriod),
    error: metadata.validationErrors.periodDurationError,
  }),
  updateContext: (context: NativeTokenPeriodicContext, value: string) => {
    // Validate that value is a valid TimePeriod
    if (!Object.values(TimePeriod).includes(value as TimePeriod)) {
      throw new InvalidInputError(
        `Invalid period type: "${value}". Valid options are: ${Object.values(TimePeriod).join(', ')}`,
      );
    }

    const periodType = value as TimePeriod;
    const periodSeconds = TIME_PERIOD_TO_SECONDS[periodType];

    // This should never happen if the above check passed, but be defensive
    if (periodSeconds === undefined) {
      throw new InvalidInputError(
        `Period type "${periodType}" is not mapped to a duration. This indicates a system error.`,
      );
    }

    const periodDuration = Number(periodSeconds);

    return {
      ...context,
      permissionDetails: {
        ...context.permissionDetails,
        periodDuration,
      },
    };
  },
};

export const startTimeRule: RuleDefinition<
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata
> = {
  name: START_TIME_ELEMENT,
  label: 'startTimeLabel',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: timestampToISO8601(context.permissionDetails.startTime),
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: t('startTimeTooltip'),
    error: metadata.validationErrors.startTimeError,
    allowPastDate: false,
  }),
  updateContext: (context: NativeTokenPeriodicContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      startTime: iso8601ToTimestamp(value),
    },
  }),
};

export const expiryRule = createExpiryRule<
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata
>({ elementName: EXPIRY_ELEMENT, translate: t });

export const allRules = [
  periodAmountRule,
  periodDurationRule,
  startTimeRule,
  expiryRule,
];
