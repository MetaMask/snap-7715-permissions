import type { RuleDefinition } from '../../core/types';
import { t } from '../../utils/i18n';
import { getIconData } from '../iconUtil';
import { createExpiryRule } from '../rules';
import type {
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata,
} from './types';

export const ALLOWANCE_AMOUNT_ELEMENT =
  'erc20-token-allowance-allowance-amount';
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
    tooltip: t('allowanceAmountTooltip'),
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

export const expiryRule = createExpiryRule<
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata
>({ elementName: EXPIRY_ELEMENT, translate: t });

export const allRules = [allowanceAmountRule, expiryRule];
