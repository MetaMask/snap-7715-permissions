import type { RuleDefinition } from '../../core/types';
import { t } from '../../utils/i18n';
import { getIconData } from '../iconUtil';
import { createExpiryRule } from '../rules';
import type {
  NativeTokenAllowanceContext,
  NativeTokenAllowanceMetadata,
} from './types';

export const ALLOWANCE_AMOUNT_ELEMENT =
  'native-token-allowance-allowance-amount';
export const EXPIRY_ELEMENT = 'native-token-allowance-expiry';

export const allowanceAmountRule: RuleDefinition<
  NativeTokenAllowanceContext,
  NativeTokenAllowanceMetadata
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
  updateContext: (context: NativeTokenAllowanceContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      allowanceAmount: value,
    },
  }),
};

export const expiryRule = createExpiryRule<
  NativeTokenAllowanceContext,
  NativeTokenAllowanceMetadata
>({ elementName: EXPIRY_ELEMENT, translate: t });

export const allRules = [allowanceAmountRule, expiryRule];
