import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Field, Input, Section, Text } from '@metamask/snaps-sdk/jsx';

import { getChainMetadata } from '../../core/chainMetadata';
import { JUSTIFICATION_SHOW_MORE_BUTTON_NAME } from '../../core/permissionHandler';
import { renderRules } from '../../core/rules';
import { AccountDetails } from '../../ui/components/AccountDetails';
import type { ItemDetails } from '../../ui/components/RequestDetails';
import { RequestDetails } from '../../ui/components/RequestDetails';
import { TokenIcon } from '../../ui/components/TokenIcon';
import { TooltipIcon } from '../../ui/components/TooltipIcon';
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

/**
 * Creates the confirmation content for a native token stream permission request.
 *
 * @param options - The options for creating the confirmation content.
 * @param options.context - The context containing stream details and account information.
 * @param options.metadata - The metadata containing stream configuration.
 * @param options.isJustificationCollapsed - Whether the justification section is collapsed.
 * @param options.origin - The origin of the permission request.
 * @param options.chainId - The chain ID for the network.
 * @returns A promise that resolves to a GenericSnapElement containing the confirmation UI.
 */
export async function createConfirmationContent({
  context,
  metadata,
  isJustificationCollapsed,
  origin,
  chainId,
}: {
  context: NativeTokenStreamContext;
  metadata: NativeTokenStreamMetadata;
  isJustificationCollapsed: boolean;
  origin: string;
  chainId: number;
}): Promise<GenericSnapElement> {
  const { amountPerSecond } = metadata;

  const { name: networkName } = getChainMetadata({ chainId });

  const itemDetails: ItemDetails[] = [
    {
      label: 'Recipient',
      text: origin,
      tooltipText: 'The site requesting the permission',
    },
    {
      label: 'Network',
      text: networkName,
      tooltipText: 'The network on which the permission is being requested',
    },
    {
      label: 'Token',
      text: context.tokenMetadata.symbol,
      iconData: context.tokenMetadata.iconDataBase64
        ? {
            iconDataBase64: context.tokenMetadata.iconDataBase64,
            altText: context.tokenMetadata.symbol,
          }
        : undefined,
    },
  ];

  return (
    <Box>
      <RequestDetails
        itemDetails={itemDetails}
        justification={context.justification}
        isJustificationShowMoreCollapsed={isJustificationCollapsed}
        justificationShowMoreElementName={JUSTIFICATION_SHOW_MORE_BUTTON_NAME}
      />
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
