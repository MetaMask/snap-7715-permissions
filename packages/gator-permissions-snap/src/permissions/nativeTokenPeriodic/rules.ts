import { TimePeriod } from '../../core/types';
import type { RuleDefinition } from '../../core/types';
import { TIME_PERIOD_TO_SECONDS } from '../../utils/time';
import { getIconData } from '../iconUtil';
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
  name: PERIOD_TYPE_ELEMENT,
  label: 'Period duration',
  type: 'dropdown',
  getRuleData: ({ context, metadata }) => ({
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    value: context.permissionDetails.periodType,
    isVisible: true,
    tooltip: 'The duration of the period',
    options: [TimePeriod.DAILY, TimePeriod.WEEKLY, 'Other'],
    error: metadata.validationErrors.periodTypeError,
  }),
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
  name: PERIOD_DURATION_ELEMENT,
  label: 'Duration (seconds)',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.periodDuration,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: context.permissionDetails.periodType === 'Other',
    tooltip: 'The length of each period in seconds',
    error: metadata.validationErrors.periodDurationError,
  }),
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
  name: START_TIME_ELEMENT,
  label: 'Start Time',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.startTime,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The start time of the stream(mm/dd/yyyy hh:mm:ss).',
    error: metadata.validationErrors.startTimeError,
    dateTimeParameterNames: {
      timestampName: 'permissionDetails.startTime',
      dateName: 'startTime.date',
      timeName: 'startTime.time',
    },
  }),
  updateContext: (context: NativeTokenPeriodicContext, value: any) => {
    return {
      ...context,
      permissionDetails: {
        ...context.permissionDetails,
        startTime: value.timestamp,
      },
      startTime: {
        date: value.date,
        time: value.time,
      },
    };
  },
};

export const expiryRule: RuleDefinition<
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata
> = {
  name: EXPIRY_ELEMENT,
  label: 'Expiry',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: context.expiry,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The expiry date of the permission(mm/dd/yyyy hh:mm:ss).',
    error: metadata.validationErrors.expiryError,
    dateTimeParameterNames: {
      timestampName: 'expiry',
      dateName: 'expiryDate.date',
      timeName: 'expiryDate.time',
    },
  }),
  updateContext: (context: NativeTokenPeriodicContext, value: any) => ({
    ...context,
    expiry: value.timestamp,
    expiryDate: {
      date: value.date,
      time: value.time,
    },
  }),
};

export const allRules = [
  periodAmountRule,
  periodTypeRule,
  periodDurationRule,
  startTimeRule,
  expiryRule,
];
