import type { RuleDefinition } from '../../core/types';
import { TimePeriod } from '../../core/types';
import type {
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
} from './types';

export const INITIAL_AMOUNT_ELEMENT = 'erc20-token-stream-initial-amount';
export const MAX_AMOUNT_ELEMENT = 'erc20-token-stream-max-amount';
export const START_TIME_ELEMENT = 'erc20-token-stream-start-time';
export const AMOUNT_PER_PERIOD_ELEMENT = 'erc20-token-stream-amount-per-period';
export const TIME_PERIOD_ELEMENT = 'erc20-token-stream-time-period';
export const EXPIRY_ELEMENT = 'erc20-token-stream-expiry';

type Erc20TokenStreamRuleDefinition = RuleDefinition<
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata
>;

export const initialAmountRule: Erc20TokenStreamRuleDefinition = {
  label: 'Initial Amount',
  name: INITIAL_AMOUNT_ELEMENT,
  type: 'number',
  isOptional: true,
  tooltip: 'The initial amount of tokens that can be streamed.',
  value: (context: Erc20TokenStreamContext) =>
    context.permissionDetails.initialAmount,
  error: (metadata: Erc20TokenStreamMetadata) =>
    metadata.validationErrors.initialAmountError,
  updateContext: (
    context: Erc20TokenStreamContext,
    value: string | undefined,
  ) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      initialAmount: value,
    },
  }),
};

export const maxAmountRule: Erc20TokenStreamRuleDefinition = {
  label: 'Max Amount',
  name: MAX_AMOUNT_ELEMENT,
  tooltip: 'The maximum amount of tokens that can be streamed.',
  type: 'number',
  isOptional: true,
  value: (context: Erc20TokenStreamContext) =>
    context.permissionDetails.maxAmount,
  error: (metadata: Erc20TokenStreamMetadata) =>
    metadata.validationErrors.maxAmountError,
  updateContext: (
    context: Erc20TokenStreamContext,
    value: string | undefined,
  ) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      maxAmount: value,
    },
  }),
};

export const startTimeRule: Erc20TokenStreamRuleDefinition = {
  label: 'Start Time',
  name: START_TIME_ELEMENT,
  type: 'text',
  tooltip: 'The start time of the stream.',
  value: (context: Erc20TokenStreamContext) =>
    context.permissionDetails.startTime,
  error: (metadata: Erc20TokenStreamMetadata) =>
    metadata.validationErrors.startTimeError,
  updateContext: (context: Erc20TokenStreamContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      startTime: value,
    },
  }),
};

export const streamAmountPerPeriodRule: Erc20TokenStreamRuleDefinition = {
  label: 'Stream Amount',
  name: AMOUNT_PER_PERIOD_ELEMENT,
  type: 'number',
  tooltip: 'The amount of tokens that can be streamed per period.',
  value: (context: Erc20TokenStreamContext) =>
    context.permissionDetails.amountPerPeriod,
  error: (metadata: Erc20TokenStreamMetadata) =>
    metadata.validationErrors.amountPerPeriodError,
  updateContext: (context: Erc20TokenStreamContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      amountPerPeriod: value,
    },
  }),
};

export const streamPeriodRule: Erc20TokenStreamRuleDefinition = {
  label: 'Stream Period',
  name: TIME_PERIOD_ELEMENT,
  type: 'dropdown',
  tooltip: 'The period of the stream.',
  options: Object.values(TimePeriod),
  value: (context: Erc20TokenStreamContext) =>
    context.permissionDetails.timePeriod,
  updateContext: (context: Erc20TokenStreamContext, value: TimePeriod) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      timePeriod: value,
    },
  }),
};

export const expiryRule: Erc20TokenStreamRuleDefinition = {
  label: 'Expiry',
  name: EXPIRY_ELEMENT,
  type: 'text',
  tooltip: 'The expiry date of the permission.',
  value: (context: Erc20TokenStreamContext) => context.expiry,
  error: (metadata: Erc20TokenStreamMetadata) =>
    metadata.validationErrors.expiryError,
  updateContext: (context: Erc20TokenStreamContext, value: string) => ({
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
