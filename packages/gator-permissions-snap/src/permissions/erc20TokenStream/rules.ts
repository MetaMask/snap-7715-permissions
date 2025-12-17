import type { RuleDefinition } from '../../core/types';
import { TimePeriod } from '../../core/types';
import { timestampToISO8601, iso8601ToTimestamp } from '../../utils/time';
import { getIconData } from '../iconUtil';
import type {
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
} from './types';
import { t } from '../../utils/i18n';

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
  label: 'initialAmountLabel',
  type: 'number',
  isOptional: true,
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.initialAmount ?? undefined,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: t('initialAmountTooltip'),
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
  label: 'startTimeLabel',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: timestampToISO8601(context.permissionDetails.startTime),
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: t('streamStartTimeTooltip'),
    error: metadata.validationErrors.startTimeError,
    allowPastDate: false,
  }),
  updateContext: (context: Erc20TokenStreamContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      startTime: iso8601ToTimestamp(value),
    },
  }),
};

export const streamAmountPerPeriodRule: Erc20TokenStreamRuleDefinition = {
  name: AMOUNT_PER_PERIOD_ELEMENT,
  label: 'streamAmountLabel',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.amountPerPeriod,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: t('streamAmountTooltip'),
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
  label: 'streamPeriodLabel',
  type: 'dropdown',
  getRuleData: ({ context }) => ({
    value: context.permissionDetails.timePeriod,
    isAdjustmentAllowed: context.isAdjustmentAllowed,
    isVisible: true,
    tooltip: t('streamPeriodTooltip'),
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
  label: 'expiryLabel',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: timestampToISO8601(context.expiry.timestamp),
    isAdjustmentAllowed: context.expiry.isAdjustmentAllowed,
    isVisible: true,
    tooltip: t('expiryTooltip'),
    error: metadata.validationErrors.expiryError,
    allowPastDate: false,
  }),
  updateContext: (context: Erc20TokenStreamContext, value: string) => ({
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
