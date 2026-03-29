import type { RuleDefinition } from '../../core/types';
import type { MessageKey } from '../../utils/i18n';
import { t } from '../../utils/i18n';
import { createExpiryRule } from '../rules';
import type { NativeTokenSwapContext, NativeTokenSwapMetadata } from './types';

export const MAX_SWAP_AMOUNT_ELEMENT = 'native-token-swap-max-amount';
export const TOKEN_RESTRICTION_ELEMENT = 'native-token-swap-token-restriction';
export const EXPIRY_ELEMENT = 'native-token-swap-expiry';

type NativeTokenSwapRuleDefinition = RuleDefinition<
  NativeTokenSwapContext,
  NativeTokenSwapMetadata
>;

export const maxSwapAmountRule: NativeTokenSwapRuleDefinition = {
  name: MAX_SWAP_AMOUNT_ELEMENT,
  label: 'maxNativeSwapAmountLabel',
  type: 'number',
  isOptional: false,
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.maxSwapAmount,
    isVisible: true,
    tooltip: t('maxNativeSwapAmountTooltip'),
    error: metadata.validationErrors.maxNativeSwapAmountError,
    isEditable: context.isAdjustmentAllowed,
  }),
  updateContext: (
    swapContext: NativeTokenSwapContext,
    value: string | null,
  ) => ({
    ...swapContext,
    permissionDetails: {
      ...swapContext.permissionDetails,
      maxSwapAmount: value ?? '',
    },
  }),
};

const TOKEN_RESTRICTION_OPTIONS: MessageKey[] = [
  'tokenSwapModeWhitelistedOnly',
  'tokenSwapModeAnyToken',
];

export const tokenRestrictionRule: NativeTokenSwapRuleDefinition = {
  name: TOKEN_RESTRICTION_ELEMENT,
  label: 'tokenSwapRestrictionLabel',
  type: 'dropdown',
  getRuleData: ({ context }) => ({
    value: context.permissionDetails.whitelistedTokensOnly
      ? 'tokenSwapModeWhitelistedOnly'
      : 'tokenSwapModeAnyToken',
    isVisible: true,
    tooltip: t('tokenSwapRestrictionTooltip'),
    options: TOKEN_RESTRICTION_OPTIONS,
    isEditable: context.isAdjustmentAllowed,
  }),
  updateContext: (swapContext: NativeTokenSwapContext, value: string) => ({
    ...swapContext,
    permissionDetails: {
      ...swapContext.permissionDetails,
      whitelistedTokensOnly: value === 'tokenSwapModeWhitelistedOnly',
    },
  }),
};

export const expiryRule = createExpiryRule<
  NativeTokenSwapContext,
  NativeTokenSwapMetadata
>({ elementName: EXPIRY_ELEMENT, translate: t });

export const allRules = [
  maxSwapAmountRule,
  tokenRestrictionRule,
  expiryRule,
];
