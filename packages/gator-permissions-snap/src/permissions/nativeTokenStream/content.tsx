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
  const { amountPerSecond } = metadata;

  return (
    <Box>
      <Section>
        {renderRules({
          rules: [initialAmountRule, maxAmountRule],
          context,
          metadata,
        })}
        <Box>
          <Divider />
        </Box>
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
    </Box>
  );
}
