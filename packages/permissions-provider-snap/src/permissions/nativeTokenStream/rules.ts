import { TimePeriod } from '../../core/types';
import { RuleDefinition } from '../rules';
import { NativeTokenStreamContext, NativeTokenStreamMetadata } from './types';

export const INITIAL_AMOUNT_ELEMENT = 'native-token-stream-initial-amount';
export const MAX_AMOUNT_ELEMENT = 'native-token-stream-max-amount';
export const START_TIME_ELEMENT = 'native-token-stream-start-time';
export const EXPIRY_ELEMENT = 'native-token-stream-expiry';
export const AMOUNT_PER_PERIOD_ELEMENT =
  'native-token-stream-amount-per-period';
export const TIME_PERIOD_ELEMENT = 'native-token-stream-time-period';

export const initialAmountRule: RuleDefinition<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata
> = {
  label: 'Initial Amount',
  name: INITIAL_AMOUNT_ELEMENT,
  type: 'number',
  isOptional: true,
  value: (context: NativeTokenStreamContext) =>
    context.permissionDetails.initialAmount,
  error: (metadata: NativeTokenStreamMetadata) =>
    metadata.validationErrors.initialAmountError,
  updateContext: (
    context: NativeTokenStreamContext,
    value: string | undefined,
  ) => {
    context.permissionDetails.initialAmount = value;
  },
};

export const maxAmountRule: RuleDefinition<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata
> = {
  label: 'Max Amount',
  name: MAX_AMOUNT_ELEMENT,
  type: 'number',
  isOptional: true,
  value: (context: NativeTokenStreamContext) =>
    context.permissionDetails.maxAmount,
  error: (metadata: NativeTokenStreamMetadata) =>
    metadata.validationErrors.maxAmountError,
  updateContext: (
    context: NativeTokenStreamContext,
    value: string | undefined,
  ) => {
    context.permissionDetails.maxAmount = value;
  },
};

export const startTimeRule: RuleDefinition<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata
> = {
  label: 'Start Time',
  name: START_TIME_ELEMENT,
  type: 'text',
  value: (context: NativeTokenStreamContext) =>
    context.permissionDetails.startTime,
  error: (metadata: NativeTokenStreamMetadata) =>
    metadata.validationErrors.startTimeError,
  updateContext: (context: NativeTokenStreamContext, value: string) => {
    context.permissionDetails.startTime = value;
  },
};

export const expiryRule: RuleDefinition<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata
> = {
  label: 'Expiry',
  name: EXPIRY_ELEMENT,
  type: 'text',
  value: (context: NativeTokenStreamContext) => context.expiry,
  error: (metadata: NativeTokenStreamMetadata) =>
    metadata.validationErrors.expiryError,
  updateContext: (context: NativeTokenStreamContext, value: string) => {
    context.expiry = value;
  },
};

export const streamAmountPerPeriodRule: RuleDefinition<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata
> = {
  label: 'Stream Amount',
  name: AMOUNT_PER_PERIOD_ELEMENT,
  type: 'number',
  value: (context: NativeTokenStreamContext) =>
    context.permissionDetails.amountPerPeriod,
  error: (metadata: NativeTokenStreamMetadata) =>
    metadata.validationErrors.amountPerPeriodError,
  updateContext: (context: NativeTokenStreamContext, value: string) => {
    context.permissionDetails.amountPerPeriod = value;
  },
};

export const streamPeriodRule: RuleDefinition<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata
> = {
  label: 'Stream Period',
  name: TIME_PERIOD_ELEMENT,
  type: 'dropdown',
  options: Object.values(TimePeriod),
  value: (context: NativeTokenStreamContext) =>
    context.permissionDetails.timePeriod,
  updateContext: (context: NativeTokenStreamContext, value: TimePeriod) => {
    context.permissionDetails.timePeriod = value;
  },
};

export const allRules = [
  initialAmountRule,
  maxAmountRule,
  startTimeRule,
  expiryRule,
  streamAmountPerPeriodRule,
  streamPeriodRule,
];
