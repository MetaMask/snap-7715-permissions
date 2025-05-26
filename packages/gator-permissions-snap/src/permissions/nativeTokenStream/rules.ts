import { TimePeriod } from '../../core/types';
import type { RuleDefinition } from '../rules';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
} from './types';

export const INITIAL_AMOUNT_ELEMENT = 'native-token-stream-initial-amount';
export const MAX_AMOUNT_ELEMENT = 'native-token-stream-max-amount';
export const START_TIME_ELEMENT = 'native-token-stream-start-time';
export const AMOUNT_PER_PERIOD_ELEMENT =
  'native-token-stream-amount-per-period';
export const TIME_PERIOD_ELEMENT = 'native-token-stream-time-period';
export const EXPIRY_ELEMENT = 'native-token-stream-expiry';

type NativeTokenStreamRuleDefinition = RuleDefinition<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata
>;

export const initialAmountRule: NativeTokenStreamRuleDefinition = {
  label: 'Initial Amount',
  name: INITIAL_AMOUNT_ELEMENT,
  type: 'number',
  isOptional: true,
  tooltip: 'The initial amount of tokens that can be streamed.',
  value: (context: NativeTokenStreamContext) =>
    context.permissionDetails.initialAmount,
  error: (metadata: NativeTokenStreamMetadata) =>
    metadata.validationErrors.initialAmountError,
  updateContext: (
    context: NativeTokenStreamContext,
    value: string | undefined,
  ) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      initialAmount: value,
    },
  }),
};

export const maxAmountRule: NativeTokenStreamRuleDefinition = {
  label: 'Max Amount',
  name: MAX_AMOUNT_ELEMENT,
  tooltip: 'The maximum amount of tokens that can be streamed.',
  type: 'number',
  isOptional: true,
  value: (context: NativeTokenStreamContext) =>
    context.permissionDetails.maxAmount,
  error: (metadata: NativeTokenStreamMetadata) =>
    metadata.validationErrors.maxAmountError,
  updateContext: (
    context: NativeTokenStreamContext,
    value: string | undefined,
  ) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      maxAmount: value,
    },
  }),
};

export const startTimeRule: NativeTokenStreamRuleDefinition = {
  label: 'Start Time',
  name: START_TIME_ELEMENT,
  type: 'text',
  tooltip: 'The start time of the stream.',
  value: (context: NativeTokenStreamContext) =>
    context.permissionDetails.startTime,
  error: (metadata: NativeTokenStreamMetadata) =>
    metadata.validationErrors.startTimeError,
  updateContext: (context: NativeTokenStreamContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      startTime: value,
    },
  }),
};

export const streamAmountPerPeriodRule: NativeTokenStreamRuleDefinition = {
  label: 'Stream Amount',
  name: AMOUNT_PER_PERIOD_ELEMENT,
  type: 'number',
  tooltip: 'The amount of tokens that can be streamed per period.',
  value: (context: NativeTokenStreamContext) =>
    context.permissionDetails.amountPerPeriod,
  error: (metadata: NativeTokenStreamMetadata) =>
    metadata.validationErrors.amountPerPeriodError,
  updateContext: (context: NativeTokenStreamContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      amountPerPeriod: value,
    },
  }),
};

export const streamPeriodRule: NativeTokenStreamRuleDefinition = {
  label: 'Stream Period',
  name: TIME_PERIOD_ELEMENT,
  type: 'dropdown',
  tooltip: 'The period of the stream.',
  options: Object.values(TimePeriod),
  value: (context: NativeTokenStreamContext) =>
    context.permissionDetails.timePeriod,
  updateContext: (context: NativeTokenStreamContext, value: TimePeriod) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      timePeriod: value,
    },
  }),
};
export const expiryRule = {
  label: 'Expiry',
  name: EXPIRY_ELEMENT,
  type: 'text',
  tooltip: 'The expiry date of the permission.',
  value: (context: NativeTokenStreamContext) => context.expiry,
  error: (metadata: NativeTokenStreamMetadata) =>
    metadata.validationErrors.expiryError,
  updateContext: (context: NativeTokenStreamContext, value: string) => ({
    ...context,
    expiry: value,
  }),
};

export const allRules = [
  initialAmountRule,
  maxAmountRule,
  startTimeRule,
  expiryRule,
  streamAmountPerPeriodRule,
  streamPeriodRule,
];
