import type {
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata,
} from './types';
import type { RuleDefinition } from '../../core/types';
import { iso8601ToTimestamp, timestampToISO8601 } from '../../utils/time';

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
    value: timestampToISO8601(context.expiry.timestamp),
    isAdjustmentAllowed: context.expiry.isAdjustmentAllowed,
    isVisible: true,
    tooltip: 'The expiry date of the permission.',
    error: metadata.validationErrors.expiryError,
    disablePast: true,
  }),
  updateContext: (context: Erc20TokenRevocationContext, value: string) => ({
    ...context,
    expiry: {
      ...context.expiry,
      timestamp: iso8601ToTimestamp(value),
    },
  }),
};

export const allRules = [expiryRule];
