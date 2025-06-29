import { TimePeriod } from '../../core/types';
import type { RuleDefinition } from '../../core/types';
import { TIME_PERIOD_TO_SECONDS } from '../../utils/time';
import { getIconData } from '../iconUtil';
import type {
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
} from './types';

export const PERIOD_AMOUNT_ELEMENT = 'erc20-token-periodic-period-amount';
export const PERIOD_TYPE_ELEMENT = 'erc20-token-periodic-period-type';
export const PERIOD_DURATION_ELEMENT = 'erc20-token-periodic-period-duration';
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

export const periodTypeRule: RuleDefinition<
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata
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
  updateContext: (context: Erc20TokenPeriodicContext, value: string) => {
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
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata
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
  updateContext: (context: Erc20TokenPeriodicContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      periodDuration: value,
    },
  }),
};

export const startTimeRule: RuleDefinition<
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata
> = {
  name: START_TIME_ELEMENT,
  label: 'Start Time',
  type: 'text',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.startTime,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The time at which the first period begins',
    error: metadata.validationErrors.startTimeError,
  }),
  updateContext: (context: Erc20TokenPeriodicContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      startTime: value,
    },
  }),
};

export const expiryRule: RuleDefinition<
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata
> = {
  name: EXPIRY_ELEMENT,
  label: 'Expiry',
  type: 'text',
  getRuleData: ({ context, metadata }) => ({
    value: context.expiry,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    error: metadata.validationErrors.expiryError,
  }),
  updateContext: (context: Erc20TokenPeriodicContext, value: string) => ({
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
