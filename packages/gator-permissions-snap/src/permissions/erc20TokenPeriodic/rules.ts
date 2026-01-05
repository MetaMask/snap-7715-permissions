import { InvalidInputError } from '@metamask/snaps-sdk';

import { TimePeriod } from '../../core/types';
import type { RuleDefinition } from '../../core/types';
import {
  getClosestTimePeriod,
  TIME_PERIOD_TO_SECONDS,
  timestampToISO8601,
  iso8601ToTimestamp,
} from '../../utils/time';
import { getIconData } from '../iconUtil';
import type {
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
} from './types';

export const PERIOD_AMOUNT_ELEMENT = 'erc20-token-periodic-period-amount';
export const PERIOD_TYPE_ELEMENT = 'erc20-token-periodic-period-type';
export const START_TIME_ELEMENT = 'erc20-token-periodic-start-date';
export const EXPIRY_ELEMENT = 'erc20-token-periodic-expiry';

export const periodAmountRule: RuleDefinition<
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata
> = {
  name: PERIOD_AMOUNT_ELEMENT,
  label: 'Amount',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.periodAmount,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The amount of tokens granted during each period',
    error: metadata.validationErrors.periodAmountError,
    iconData: getIconData(context),
  }),
  updateContext: (context: Erc20TokenPeriodicContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      periodAmount: value,
    },
  }),
};

export const periodDurationRule: RuleDefinition<
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata
> = {
  name: PERIOD_TYPE_ELEMENT,
  label: 'Frequency',
  type: 'dropdown',
  getRuleData: ({ context, metadata }) => ({
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    value: getClosestTimePeriod(context.permissionDetails.periodDuration),
    isVisible: true,
    tooltip: 'The duration of the period',
    options: Object.values(TimePeriod),
    error: metadata.validationErrors.periodDurationError,
  }),
  updateContext: (context: Erc20TokenPeriodicContext, value: string) => {
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
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata
> = {
  name: START_TIME_ELEMENT,
  label: 'Start Time',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: timestampToISO8601(context.permissionDetails.startTime),
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The time at which the first period begins.',
    error: metadata.validationErrors.startTimeError,
    allowPastDate: false,
  }),
  updateContext: (context: Erc20TokenPeriodicContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      startTime: iso8601ToTimestamp(value),
    },
  }),
};

export const expiryRule: RuleDefinition<
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata
> = {
  name: EXPIRY_ELEMENT,
  label: 'Expiry',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: timestampToISO8601(context.expiry.timestamp),
    isAdjustmentAllowed: context.expiry.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The expiry date of the permission.',
    error: metadata.validationErrors.expiryError,
    allowPastDate: false,
  }),
  updateContext: (context: Erc20TokenPeriodicContext, value: string) => ({
    ...context,
    expiry: {
      ...context.expiry,
      timestamp: iso8601ToTimestamp(value),
    },
  }),
};

export const allRules = [
  periodAmountRule,
  periodDurationRule,
  startTimeRule,
  expiryRule,
];
