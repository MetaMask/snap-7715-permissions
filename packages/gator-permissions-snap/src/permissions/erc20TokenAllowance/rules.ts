import type { RuleDefinition } from '../../core/types';
import { t } from '../../utils/i18n';
import {
  timestampToISO8601,
  iso8601ToTimestampIgnoreTimezone,
} from '../../utils/time';
import { getIconData } from '../iconUtil';
import { createExpiryRule } from '../rules';
import type {
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata,
} from './types';

export const ALLOWANCE_AMOUNT_ELEMENT =
  'erc20-token-allowance-allowance-amount';
export const START_TIME_ELEMENT = 'erc20-token-allowance-start-date';
export const EXPIRY_ELEMENT = 'erc20-token-allowance-expiry';

export const allowanceAmountRule: RuleDefinition<
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata
> = {
  name: ALLOWANCE_AMOUNT_ELEMENT,
  label: 'amountLabel',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.allowanceAmount,
    isVisible: true,
    tooltip: t('amountTooltip'),
    error: metadata.validationErrors.allowanceAmountError,
    iconData: getIconData(context),
    isEditable: context.isAdjustmentAllowed,
  }),
  updateContext: (context: Erc20TokenAllowanceContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      allowanceAmount: value,
    },
  }),
};

export const startTimeRule: RuleDefinition<
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata
> = {
  name: START_TIME_ELEMENT,
  label: 'startTimeLabel',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: timestampToISO8601(context.permissionDetails.startTime),
    isVisible: true,
    tooltip: t('startTimeTooltip'),
    error: metadata.validationErrors.startTimeError,
    allowPastDate: true,
    isEditable: context.isAdjustmentAllowed,
  }),
  updateContext: (context: Erc20TokenAllowanceContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      startTime: iso8601ToTimestampIgnoreTimezone(value),
    },
  }),
};

export const expiryRule = createExpiryRule<
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata
>({ elementName: EXPIRY_ELEMENT, translate: t });

export const allRules = [allowanceAmountRule, startTimeRule, expiryRule];
