import type {
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata,
} from './types';
import type { RuleDefinition } from '../../core/types';
import { t } from '../../utils/i18n';

export const EXPIRY_ELEMENT = 'erc20-token-revocation-expiry';

type Erc20TokenRevocationRuleDefinition = RuleDefinition<
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata
>;

export const expiryRule: Erc20TokenRevocationRuleDefinition = {
  name: EXPIRY_ELEMENT,
  label: 'expiryLabel',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: context.expiry.timestamp.toString(),
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
  updateContext: (context: Erc20TokenRevocationContext, value: any) => ({
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

export const allRules = [expiryRule];
