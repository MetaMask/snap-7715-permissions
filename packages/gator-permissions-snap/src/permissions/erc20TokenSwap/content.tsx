import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import {
  Address,
  Box,
  Divider,
  Icon,
  Section,
  Text,
} from '@metamask/snaps-sdk/jsx';
import { parseCaipAccountId, parseCaipAssetType } from '@metamask/utils';

import {
  expiryRule,
  getReceiveIconData,
  maxSpendAmountRule,
  minReceiveAmountRule,
} from './rules';
import { formatSelectorForDisplay } from './selectors';
import type { Erc20TokenSwapContext, Erc20TokenSwapMetadata } from './types';
import { renderRules } from '../../core/rules';
import { AddressField } from '../../ui/components/AddressField';
import { Field } from '../../ui/components/Field';
import { TokenField } from '../../ui/components/TokenField';
import { t } from '../../utils/i18n';

/**
 * Creates UI content for an ERC-20 token swap permission confirmation.
 *
 * The outcome (max spend, min receive, delivered to the user's own account) is
 * shown first and is adjustable when the request allows it. The allow-listed
 * contracts and functions are read-only, and expiry is always adjustable.
 * @param args - The configuration for the confirmation content.
 * @param args.context - Context with formatted amounts, tokens, and allow-lists.
 * @param args.metadata - Validation state for rules.
 * @returns Confirmation section content.
 */
export async function renderBody({
  context,
  metadata,
}: {
  context: Erc20TokenSwapContext;
  metadata: Erc20TokenSwapMetadata;
}): Promise<SnapElement> {
  const { address: accountAddress } = parseCaipAccountId(
    context.accountAddressCaip10,
  );
  const { assetReference: receiveTokenAddress } = parseCaipAssetType(
    context.receiveTokenAddressCaip19,
  );
  const { targets, selectors } = context.permissionDetails;

  return (
    <Box>
      <Section>
        {renderRules({
          rules: [maxSpendAmountRule, minReceiveAmountRule],
          context,
          metadata,
        })}
        <TokenField
          label={t('receiveTokenLabel')}
          tokenSymbol={context.receiveTokenMetadata.symbol}
          tokenAddress={receiveTokenAddress}
          iconData={getReceiveIconData(context)}
        />
        <AddressField
          label={t('deliveredToLabel')}
          tooltip={t('deliveredToTooltip')}
          address={accountAddress}
        />
        <Divider />
        <Field
          label={t('allowedContractsLabel')}
          tooltip={t('allowedContractsTooltip')}
          variant="display"
          direction="vertical"
        >
          <Box direction="vertical">
            {targets.map((target) => (
              <Address key={target} address={target} displayName={true} />
            ))}
          </Box>
        </Field>
        <Field
          label={t('allowedFunctionsLabel')}
          tooltip={t('allowedFunctionsTooltip')}
          variant="display"
          direction="vertical"
        >
          <Box direction="vertical">
            {selectors.map((selector) => (
              <Box direction="horizontal" key={selector}>
                <Icon name="minus" color="default" size="inherit" />
                <Text>{formatSelectorForDisplay(selector)}</Text>
              </Box>
            ))}
          </Box>
        </Field>
        <Divider />
        {renderRules({
          rules: [expiryRule],
          context,
          metadata,
        })}
      </Section>
    </Box>
  );
}
