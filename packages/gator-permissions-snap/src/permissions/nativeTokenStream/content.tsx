import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Field, Input, Section, Text } from '@metamask/snaps-sdk/jsx';

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
import { AccountDetails, TokenIcon, TooltipIcon } from '../../ui/components';

/**
 * Creates the confirmation content for a native token stream permission request.
 * @param options - The options for creating the confirmation content.
 * @param options.context - The context containing stream details and account information.
 * @param options.metadata - The metadata containing stream configuration.
 * @returns A promise that resolves to a GenericSnapElement containing the confirmation UI.
 */
export async function createConfirmationContent({
  context,
  metadata,
}: {
  context: NativeTokenStreamContext;
  metadata: NativeTokenStreamMetadata;
}): Promise<GenericSnapElement> {
  const { amountPerSecond } = metadata;

  return (
    <Box>
      <AccountDetails
        account={context.accountDetails}
        tokenMetadata={context.tokenMetadata}
        title="Stream from"
        tooltip="The account that the token stream comes from."
      />
      <Section>
        {renderRules({
          rules: [streamAmountPerPeriodRule, streamPeriodRule],
          context,
          metadata,
        })}

        <Box direction="vertical">
          <Box direction="horizontal" alignment="space-between">
            <Box direction="horizontal">
              <Text>Stream rate</Text>
              <TooltipIcon tooltip="The amount of tokens to stream per second." />
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
              value={`${amountPerSecond} ETH/sec`}
              disabled={true}
            />
          </Field>
        </Box>
      </Section>

      <Section>
        {renderRules({
          rules: [initialAmountRule, maxAmountRule, startTimeRule, expiryRule],
          context,
          metadata,
        })}
      </Section>
    </Box>
  );
}
