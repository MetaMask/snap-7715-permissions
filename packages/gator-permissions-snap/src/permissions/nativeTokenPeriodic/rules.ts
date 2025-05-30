import { TimePeriod } from '../../core/types';
import type { RuleDefinition } from '../../core/types';
import { TIME_PERIOD_TO_SECONDS } from '../../utils/time';
import type {
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
} from './types';

export const PERIOD_AMOUNT_ELEMENT = 'native-token-periodic-period-amount';
export const PERIOD_TYPE_ELEMENT = 'native-token-periodic-period-type';
export const PERIOD_DURATION_ELEMENT = 'native-token-periodic-period-duration';
export const START_TIME_ELEMENT = 'native-token-periodic-start-date';
export const EXPIRY_ELEMENT = 'native-token-periodic-expiry';

export const periodAmountRule: RuleDefinition<
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata
> = {
  label: 'Amount',
  name: PERIOD_AMOUNT_ELEMENT,
  tooltip: 'The amount of tokens granted during each period',
  type: 'number',
  value: (context: NativeTokenPeriodicContext) =>
    context.permissionDetails.periodAmount,
  error: (metadata: NativeTokenPeriodicMetadata) =>
    metadata.validationErrors.periodAmountError,
  updateContext: (context: NativeTokenPeriodicContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      periodAmount: value,
    },
  }),
};

export const periodTypeRule: RuleDefinition<
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata
> = {
  label: 'Period duration',
  name: PERIOD_TYPE_ELEMENT,
  tooltip: 'The duration of the period',
  type: 'dropdown',
  options: [TimePeriod.DAILY, TimePeriod.WEEKLY, 'Other'],
  value: (context: NativeTokenPeriodicContext) =>
    context.permissionDetails.periodType,
  error: (metadata: NativeTokenPeriodicMetadata) =>
    metadata.validationErrors.periodTypeError,
  updateContext: (context: NativeTokenPeriodicContext, value: string) => {
    const periodType = value as TimePeriod | 'Other';
    const periodDuration =
      periodType === 'Other'
        ? context.permissionDetails.periodDuration
        : Number(TIME_PERIOD_TO_SECONDS[periodType]).toString();

    return {
      ...context,
      permissionDetails: {
        ...context.permissionDetails,
        periodType,
        periodDuration,
      },
    };
  },
};

export const periodDurationRule: RuleDefinition<
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata
> = {
  label: 'Duration (seconds)',
  name: PERIOD_DURATION_ELEMENT,
  tooltip: 'The length of each period in seconds',
  type: 'number',
  value: (context: NativeTokenPeriodicContext) =>
    context.permissionDetails.periodDuration,
  error: (metadata: NativeTokenPeriodicMetadata) =>
    metadata.validationErrors.periodDurationError,
  updateContext: (context: NativeTokenPeriodicContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      periodDuration: value,
    },
  }),
  isVisible: (context: NativeTokenPeriodicContext) =>
    context.permissionDetails.periodType === 'Other',
};

export const startTimeRule: RuleDefinition<
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata
> = {
  label: 'Start Time',
  name: START_TIME_ELEMENT,
  tooltip: 'The time at which the first period begins',
  type: 'text',
  value: (context: NativeTokenPeriodicContext) =>
    context.permissionDetails.startTime,
  error: (metadata: NativeTokenPeriodicMetadata) =>
    metadata.validationErrors.startTimeError,
  updateContext: (context: NativeTokenPeriodicContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      startTime: value,
    },
  }),
};

export const expiryRule: RuleDefinition<
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata
> = {
  label: 'Expiry',
  name: EXPIRY_ELEMENT,
  type: 'text',
  value: (context: NativeTokenPeriodicContext) => context.expiry,
  error: (metadata: NativeTokenPeriodicMetadata) =>
    metadata.validationErrors.expiryError,
  updateContext: (context: NativeTokenPeriodicContext, value: string) => ({
    ...context,
    expiry: value,
  }),
};

export const allRules = [
  periodAmountRule,
  periodTypeRule,
  periodDurationRule,
  startTimeRule,
  expiryRule,
];
