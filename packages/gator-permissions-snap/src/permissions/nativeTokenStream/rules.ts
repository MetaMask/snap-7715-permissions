import type { RuleDefinition } from '../../core/types';
import { TimePeriod } from '../../core/types';
import { timestampToISO8601, iso8601ToTimestamp } from '../../utils/time';
import { getIconData } from '../iconUtil';
import { createExpiryRule } from '../rules';
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
    isVisible: true,
    iconData: getIconData(context),
    tooltip: t('initialAmountTooltip'),
    error: metadata.validationErrors.initialAmountError,
  }),
  updateContext: (context: NativeTokenStreamContext, value: string | null) => ({
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
    isVisible: true,
    tooltip: t('maxAmountTooltip'),
    iconData: getIconData(context),
    error: metadata.validationErrors.maxAmountError,
  }),
  updateContext: (context: NativeTokenStreamContext, value: string | null) => ({
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
    value: timestampToISO8601(context.permissionDetails.startTime),
    isVisible: true,
    tooltip: t('streamStartTimeTooltip'),
    error: metadata.validationErrors.startTimeError,
    allowPastDate: false,
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
  label: 'streamAmountLabel',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.amountPerPeriod,
    isVisible: true,
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

export const expiryRule = createExpiryRule<
  NativeTokenStreamContext,
  NativeTokenStreamMetadata
>({ elementName: EXPIRY_ELEMENT, translate: t });

export const allRules = [
  initialAmountRule,
  maxAmountRule,
  startTimeRule,
  expiryRule,
  streamAmountPerPeriodRule,
  streamPeriodRule,
];
