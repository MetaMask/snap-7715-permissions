import type { IconData, RuleDefinition } from '../../core/types';
import { t } from '../../utils/i18n';
import { getIconData } from '../iconUtil';
import { createExpiryRule } from '../rules';
import type { Erc20TokenSwapContext, Erc20TokenSwapMetadata } from './types';

export const MAX_SPEND_AMOUNT_ELEMENT = 'erc20-token-swap-max-spend-amount';
export const MIN_RECEIVE_AMOUNT_ELEMENT = 'erc20-token-swap-min-receive-amount';
export const EXPIRY_ELEMENT = 'erc20-token-swap-expiry';

/**
 * Extracts icon data for the token being received.
 * `getIconData` only reads the `BaseContext` token slot, which holds the token
 * being spent, so the receive token needs its own accessor.
 * @param context - The ERC-20 token swap context.
 * @returns Icon data for the receive token, or undefined if no icon is available.
 */
export const getReceiveIconData = (
  context: Erc20TokenSwapContext,
): IconData | undefined => {
  const { iconDataBase64, symbol } = context.receiveTokenMetadata;
  if (!iconDataBase64) {
    return undefined;
  }

  return {
    iconDataBase64,
    iconAltText: symbol,
  };
};

export const maxSpendAmountRule: RuleDefinition<
  Erc20TokenSwapContext,
  Erc20TokenSwapMetadata
> = {
  name: MAX_SPEND_AMOUNT_ELEMENT,
  label: 'maxSpendAmountLabel',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.maxSpendAmount,
    isVisible: true,
    tooltip: t('maxSpendAmountTooltip'),
    error: metadata.validationErrors.maxSpendAmountError,
    iconData: getIconData(context),
    isEditable: context.isAdjustmentAllowed,
  }),
  updateContext: (context: Erc20TokenSwapContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      maxSpendAmount: value,
    },
  }),
};

export const minReceiveAmountRule: RuleDefinition<
  Erc20TokenSwapContext,
  Erc20TokenSwapMetadata
> = {
  name: MIN_RECEIVE_AMOUNT_ELEMENT,
  label: 'minReceiveAmountLabel',
  type: 'number',
  getRuleData: ({ context, metadata }) => ({
    value: context.permissionDetails.minReceiveAmount,
    isVisible: true,
    tooltip: t('minReceiveAmountTooltip'),
    error: metadata.validationErrors.minReceiveAmountError,
    iconData: getReceiveIconData(context),
    isEditable: context.isAdjustmentAllowed,
  }),
  updateContext: (context: Erc20TokenSwapContext, value: string) => ({
    ...context,
    permissionDetails: {
      ...context.permissionDetails,
      minReceiveAmount: value,
    },
  }),
};

export const expiryRule = createExpiryRule<
  Erc20TokenSwapContext,
  Erc20TokenSwapMetadata
>({ elementName: EXPIRY_ELEMENT, translate: t });

export const allRules = [maxSpendAmountRule, minReceiveAmountRule, expiryRule];
