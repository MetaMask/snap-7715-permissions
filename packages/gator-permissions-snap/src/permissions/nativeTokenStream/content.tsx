import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Divider,
  Field,
  Input,
  Section,
  Text,
} from '@metamask/snaps-sdk/jsx';

import {
  initialAmountRule,
  maxAmountRule,
  startTimeRule,
  expiryRule,
  streamAmountPerPeriodRule,
  streamPeriodRule,
} from './rules';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
} from './types';
import { renderRules } from '../../core/rules';
import { TokenIcon, TooltipIcon } from '../../ui/components';
import { t } from '../../utils/i18n';

/**
 * Creates the confirmation content for a native token stream permission request.
 * @param options - The options for creating the confirmation content.
 * @param options.context - The context containing stream details and account information.
 * @param options.metadata - The metadata containing stream configuration.
 * @returns A promise that resolves to a SnapElement containing the confirmation UI.
 */
export async function createConfirmationContent({
  context,
  metadata,
}: {
  context: NativeTokenStreamContext;
  metadata: NativeTokenStreamMetadata;
}): Promise<SnapElement> {
  const { amountPerSecond, totalExposure } = metadata;

  const totalExposureNotice =
    totalExposure === null
      ? t('totalExposureUnlimited', [context.tokenMetadata.symbol])
      : t('totalExposure', [totalExposure, context.tokenMetadata.symbol]);

  return (
    <Box>
      <Section>
        <Text color="warning">{totalExposureNotice}</Text>
        {renderRules({
          rules: [initialAmountRule, maxAmountRule],
          context,
          metadata,
        })}
        <Divider />
        {renderRules({
          rules: [startTimeRule, expiryRule],
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

        <Box direction="vertical">
          <Box direction="horizontal" alignment="space-between">
            <Box direction="horizontal">
              <Text>{t('streamRateLabel')}</Text>
              <TooltipIcon tooltip={t('streamRateTooltip')} />
            </Box>
          </Box>
          <Field>
            <Box>
              <TokenIcon
                imageDataBase64={context.tokenMetadata.iconDataBase64}
                altText={context.tokenMetadata.symbol}
              />
            </Box>
            <Input
              name="stream-rate"
              type="text"
              value={t('streamRateValue', [
                amountPerSecond,
                context.tokenMetadata.symbol,
              ])}
              disabled={true}
            />
          </Field>
        </Box>
      </Section>
    </Box>
  );
}
