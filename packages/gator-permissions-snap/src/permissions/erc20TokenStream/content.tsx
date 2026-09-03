import type { CaipAssetType } from '@metamask/snaps-sdk';
import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Divider, Section, Text } from '@metamask/snaps-sdk/jsx';

import {
  initialAmountRule,
  maxAmountRule,
  startTimeRule,
  expiryRule,
  streamAmountPerPeriodRule,
  streamPeriodRule,
} from './rules';
import type {
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
} from './types';
import type { TokenMetadataCoordinator } from '../../core/coordinators/TokenMetadataCoordinator';
import { renderRules } from '../../core/rules';
import { Field, TokenIcon } from '../../ui/components';
import { t } from '../../utils/i18n';
import { getIconData, getTokenSymbol } from '../iconUtil';

/**
 * Creates the confirmation content for an ERC20 token stream permission request.
 * @param options - The options for creating the confirmation content.
 * @param options.context - The context containing stream details and account information.
 * @param options.metadata - The metadata containing stream configuration.
 * @param options.tokenMetadata - Token metadata coordinator for the request.
 * @returns A promise that resolves to a SnapElement containing the confirmation UI.
 */
export async function renderBody({
  context,
  metadata,
  tokenMetadata,
}: {
  context: Erc20TokenStreamContext;
  metadata: Erc20TokenStreamMetadata;
  tokenMetadata: TokenMetadataCoordinator;
}): Promise<SnapElement> {
  const { amountPerSecond, totalExposure } = metadata;
  const symbol = getTokenSymbol(tokenMetadata, context.primaryTokenCaip19);
  const iconData = getIconData(tokenMetadata, context.primaryTokenCaip19);

  const totalExposureValue =
    totalExposure === null
      ? t('totalExposureUnlimited')
      : `${totalExposure} ${symbol}`;

  const streamRateValue = t('streamRateValue', [amountPerSecond, symbol]);

  const ruleOptions = {
    context,
    metadata,
    tokenMetadataCoordinator: tokenMetadata,
    defaultTokenCaip19: (ctx: Erc20TokenStreamContext): CaipAssetType =>
      ctx.primaryTokenCaip19,
  };

  return (
    <Box>
      <Section>
        {renderRules({
          rules: [initialAmountRule, maxAmountRule],
          ...ruleOptions,
        })}
        <Divider />
        {renderRules({
          rules: [startTimeRule, expiryRule],
          ...ruleOptions,
        })}
      </Section>

      <Section>
        {renderRules({
          rules: [streamAmountPerPeriodRule, streamPeriodRule],
          ...ruleOptions,
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
                  imageDataBase64={iconData?.iconDataBase64 ?? null}
                  altText={iconData?.iconAltText ?? symbol}
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
                  imageDataBase64={iconData?.iconDataBase64 ?? null}
                  altText={iconData?.iconAltText ?? symbol}
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
