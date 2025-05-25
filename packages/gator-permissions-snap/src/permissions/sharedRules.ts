import type { BaseContext } from '../core/types';
import type { RuleDefinition } from './rules';

const EXPIRY_ELEMENT = 'permission-expiry';

export const createExpiryRule = <
  TContext extends BaseContext,
  TMetadata extends object,
>(): RuleDefinition<TContext, TMetadata> => {
  return {
    label: 'Expiry',
    name: EXPIRY_ELEMENT,
    type: 'text',
    tooltip: 'The expiry date of the permission.',
    value: (context: TContext) => context.expiry,
    updateContext: (context: TContext, value: string) => ({
      ...context,
      expiry: value,
    }),
  };
};
