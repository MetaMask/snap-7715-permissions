import type { RuleDefinition } from '../../core/types';
import { TimePeriod } from '../../core/types';
import { getIconData } from '../iconUtil';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
} from './types';
import { t } from '../../utils/i18n';

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
  label: 'initialAmountLabel',
  type: 'number',
  isOptional: true,
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.initialAmount ?? undefined,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    iconData: getIconData(context),
    tooltip: t('initialAmountTooltip'),
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
  label: 'maxAmountLabel',
  type: 'number',
  isOptional: true,
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.maxAmount ?? undefined,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: t('maxAmountTooltip'),
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
  label: 'startTimeLabel',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.startTime.toString(),
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: t('streamStartTimeTooltip'),
    error: metadata.validationErrors.startTimeError,
    dateTimeParameterNames: {
      timestampName: 'permissionDetails.startTime',
      dateName: 'startTime.date',
      timeName: 'startTime.time',
    },
  }),
  updateContext: (context: NativeTokenStreamContext, value: any) => {
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

export const streamAmountPerPeriodRule: NativeTokenStreamRuleDefinition = {
  name: AMOUNT_PER_PERIOD_ELEMENT,
  label: 'streamAmountLabel',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.amountPerPeriod,
    isVisible: true,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    tooltip: t('streamAmountTooltip'),
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
  label: 'streamPeriodLabel',
  type: 'dropdown',
  getRuleData: ({ context }) => ({
    value: context.permissionDetails.timePeriod,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: t('streamPeriodTooltip'),
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
  label: 'expiryLabel',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: context.expiry.timestamp.toLocaleString(),
    isAdjustmentAllowed: context.expiry.isAdjustmentAllowed,
    isVisible: true,
    tooltip: t('expiryTooltip'),
    error: metadata.validationErrors.expiryError,
    dateTimeParameterNames: {
      timestampName: 'expiry.timestamp',
      dateName: 'expiryDate.date',
      timeName: 'expiryDate.time',
    },
  }),
  updateContext: (context: NativeTokenStreamContext, value: any) => ({
    ...context,
    expiry: {
      ...context.expiry,
      timestamp: value.timestamp,
    },
    expiryDate: {
      date: value.date,
      time: value.time,
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
