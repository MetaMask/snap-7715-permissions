import type {
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata,
} from './types';
import type { RuleDefinition } from '../../core/types';

export const EXPIRY_ELEMENT = 'erc20-token-revocation-expiry';

type Erc20TokenRevocationRuleDefinition = RuleDefinition<
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata
>;

export const expiryRule: Erc20TokenRevocationRuleDefinition = {
  name: EXPIRY_ELEMENT,
  label: 'Expiry',
  type: 'datetime',
  getRuleData: ({ context, metadata }) => ({
    value: context.expiry.timestamp.toString(),
    isAdjustmentAllowed: context.expiry.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The expiry date of the permission(mm/dd/yyyy hh:mm:ss).',
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
