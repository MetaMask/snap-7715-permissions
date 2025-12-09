import type { RuleDefinition } from '../../core/types';
import { TimePeriod } from '../../core/types';
import { timestampToISO8601, iso8601ToTimestamp } from '../../utils/time';
import { getIconData } from '../iconUtil';
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
  name: INITIAL_AMOUNT_ELEMENT,
  label: 'Initial Amount',
  type: 'number',
  isOptional: true,
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.initialAmount ?? undefined,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    iconData: getIconData(context),
    tooltip: 'The initial amount of tokens that can be streamed.',
    error: metadata.validationErrors.initialAmountError,
  }),
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
  name: MAX_AMOUNT_ELEMENT,
  label: 'Max Amount',
  type: 'number',
  isOptional: true,
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.maxAmount ?? undefined,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The maximum amount of tokens that can be streamed.',
    iconData: getIconData(context),
    error: metadata.validationErrors.maxAmountError,
  }),
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
  name: START_TIME_ELEMENT,
  label: 'Start Time',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: timestampToISO8601(context.permissionDetails.startTime),
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The start time of the stream.',
    error: metadata.validationErrors.startTimeError,
    disablePast: true,
  }),
  updateContext: (context: NativeTokenStreamContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      startTime: iso8601ToTimestamp(value),
    },
  }),
};

export const streamAmountPerPeriodRule: NativeTokenStreamRuleDefinition = {
  name: AMOUNT_PER_PERIOD_ELEMENT,
  label: 'Stream Amount',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.amountPerPeriod,
    isVisible: true,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    tooltip: 'The amount of tokens that can be streamed per period.',
    iconData: getIconData(context),
    error: metadata.validationErrors.amountPerPeriodError,
  }),
  updateContext: (context: NativeTokenStreamContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      amountPerPeriod: value,
    },
  }),
};

export const streamPeriodRule: NativeTokenStreamRuleDefinition = {
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
  updateContext: (context: NativeTokenStreamContext, value: TimePeriod) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      timePeriod: value,
    },
  }),
};

export const expiryRule: NativeTokenStreamRuleDefinition = {
  name: EXPIRY_ELEMENT,
  label: 'Expiry',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: timestampToISO8601(context.expiry.timestamp),
    isAdjustmentAllowed: context.expiry.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The expiry date of the permission.',
    error: metadata.validationErrors.expiryError,
    disablePast: true,
  }),
  updateContext: (context: NativeTokenStreamContext, value: string) => ({
    ...context,
    expiry: {
      ...context.expiry,
      timestamp: iso8601ToTimestamp(value),
    },
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
