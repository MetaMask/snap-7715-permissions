import type { RuleDefinition } from '../../core/types';
import { TimePeriod } from '../../core/types';
import { getIconData } from '../iconUtil';
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
  name: INITIAL_AMOUNT_ELEMENT,
  label: 'Initial Amount',
  type: 'number',
  isOptional: true,
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.initialAmount,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The initial amount of tokens that can be streamed.',
    iconData: getIconData(context),
    error: metadata.validationErrors.initialAmountError,
  }),
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
  name: MAX_AMOUNT_ELEMENT,
  label: 'Max Amount',
  type: 'number',
  isOptional: true,
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.maxAmount,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The maximum amount of tokens that can be streamed.',
    iconData: getIconData(context),
    error: metadata.validationErrors.maxAmountError,
  }),
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
  name: START_TIME_ELEMENT,
  label: 'Start Time',
  type: 'text',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.startTime,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The start time of the stream.',
    error: metadata.validationErrors.startTimeError,
  }),
  updateContext: (context: Erc20TokenStreamContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      startTime: value,
    },
  }),
};

export const streamAmountPerPeriodRule: Erc20TokenStreamRuleDefinition = {
  name: AMOUNT_PER_PERIOD_ELEMENT,
  label: 'Stream Amount',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.amountPerPeriod,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The amount of tokens that can be streamed per period.',
    iconData: getIconData(context),
    error: metadata.validationErrors.amountPerPeriodError,
  }),
  updateContext: (context: Erc20TokenStreamContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      amountPerPeriod: value,
    },
  }),
};

export const streamPeriodRule: Erc20TokenStreamRuleDefinition = {
  name: TIME_PERIOD_ELEMENT,
  label: 'Stream Period',
  type: 'dropdown',
  getRuleData: ({ context }) => ({
    value: context.permissionDetails.timePeriod,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The period of the stream.',
    options: Object.values(TimePeriod),
  }),
  updateContext: (context: Erc20TokenStreamContext, value: TimePeriod) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      timePeriod: value,
    },
  }),
};

export const expiryRule: Erc20TokenStreamRuleDefinition = {
  name: EXPIRY_ELEMENT,
  label: 'Expiry',
  type: 'text',
  getRuleData: ({ context, metadata }) => ({
    value: context.expiry,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The expiry date of the permission.',
    error: metadata.validationErrors.expiryError,
  }),
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
