import type { RuleDefinition } from '../../core/types';
import type {
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
} from './types';

export const PERIOD_AMOUNT_ELEMENT = 'native-token-periodic-period-amount';
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

export const periodDurationRule: RuleDefinition<
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata
> = {
  label: 'Frequency',
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
  periodDurationRule,
  startTimeRule,
  expiryRule,
];
