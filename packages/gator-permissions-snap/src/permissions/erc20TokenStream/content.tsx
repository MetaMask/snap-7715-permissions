import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Divider, Section, Text } from '@metamask/snaps-sdk/jsx';

import {
  initialAmountRule,
  maxAmountRule,
  startTimeRule,
  expiryRule,
  redeemerRule,
  streamAmountPerPeriodRule,
  streamPeriodRule,
} from './rules';
import type {
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
} from './types';
import { renderRules } from '../../core/rules';
import { Field, TokenIcon } from '../../ui/components';
import { t } from '../../utils/i18n';

/**
 * Creates the confirmation content for an ERC20 token stream permission request.
 * @param options - The options for creating the confirmation content.
 * @param options.context - The context containing stream details and account information.
 * @param options.metadata - The metadata containing stream configuration.
 * @returns A promise that resolves to a SnapElement containing the confirmation UI.
 */
export async function createConfirmationContent({
  context,
  metadata,
}: {
  context: Erc20TokenStreamContext;
  metadata: Erc20TokenStreamMetadata;
}): Promise<SnapElement> {
  const { amountPerSecond, totalExposure } = metadata;

  const totalExposureValue =
    totalExposure === null
      ? t('totalExposureUnlimited')
      : `${totalExposure} ${context.tokenMetadata.symbol}`;

  const streamRateValue = t('streamRateValue', [
    amountPerSecond,
    context.tokenMetadata.symbol,
  ]);

  return (
    <Box>
      <Section>
        {renderRules({
          rules: [initialAmountRule, maxAmountRule],
          context,
          metadata,
        })}
        <Divider />
        {renderRules({
          rules: [startTimeRule, expiryRule, redeemerRule],
          context,
          metadata,
        })}
      </Section>

      <Section>
        {renderRules({
          rules: [streamAmountPerPeriodRule, streamPeriodRule],
          context,
          metadata,
        })}

        <Field
          label={t('streamRateLabel')}
          tooltip={t('streamRateTooltip')}
          variant="display"
          direction="vertical"
        >
          <Section>
            <Box direction="horizontal">
              <Box>
                <TokenIcon
                  imageDataBase64={context.tokenMetadata.iconDataBase64}
                  altText={context.tokenMetadata.symbol}
                />
              </Box>
              <Text>{streamRateValue}</Text>
            </Box>
          </Section>
        </Field>

        <Field
          label={t('totalExposureLabel')}
          tooltip={t('totalExposureTooltip')}
          variant="display"
          direction="vertical"
        >
          <Section>
            <Box direction="horizontal">
              <Box>
                <TokenIcon
                  imageDataBase64={context.tokenMetadata.iconDataBase64}
                  altText={context.tokenMetadata.symbol}
                />
              </Box>
              <Text>{totalExposureValue}</Text>
            </Box>
          </Section>
        </Field>
      </Section>
    </Box>
  );
}
