import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Button, Input, Section, Text } from '@metamask/snaps-sdk/jsx';

import { getChainName } from '../../../../shared/src/utils/common';
import { JUSTIFICATION_SHOW_MORE_BUTTON_NAME } from '../../core/permissionHandler';
import { TOGGLE_ADD_MORE_RULES_BUTTON } from '../../core/ruleModalManager';
import { renderRules } from '../../core/rules';
import { AccountDetails } from '../../ui/components/AccountDetails';
import type { ItemDetails } from '../../ui/components/RequestDetails';
import { RequestDetails } from '../../ui/components/RequestDetails';
import { RequestHeader } from '../../ui/components/RequestHeader';
import { TooltipIcon } from '../../ui/components/TooltipIcon';
import { IconUrls } from '../../ui/iconConstant';
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
 * @param options.showAddMoreRulesButton - Whether to show the "Add more rules" button.
 * @returns A promise that resolves to a GenericSnapElement containing the confirmation UI.
 */
export async function createConfirmationContent({
  context,
  metadata,
  isJustificationCollapsed,
  origin,
  chainId,
  showAddMoreRulesButton,
}: {
  context: NativeTokenStreamContext;
  metadata: NativeTokenStreamMetadata;
  isJustificationCollapsed: boolean;
  origin: string;
  chainId: number;
  showAddMoreRulesButton: boolean;
}): Promise<GenericSnapElement> {
  const { amountPerSecond } = metadata;

  const rulesToAddButton = showAddMoreRulesButton ? (
    <Button name={TOGGLE_ADD_MORE_RULES_BUTTON}>Add more rules</Button>
  ) : null;

  const networkName = getChainName(chainId);

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
      text: 'ETH',
      iconUrl: IconUrls.ethereum.token,
    },
  ];

  return (
    <Box>
      <Box direction="vertical">
        <RequestHeader title="Native token stream" />
        <RequestDetails
          itemDetails={itemDetails}
          justification="Permission to stream native tokens"
          isJustificationShowMoreCollapsed={isJustificationCollapsed}
          justificationShowMoreElementName={JUSTIFICATION_SHOW_MORE_BUTTON_NAME}
        />
        <AccountDetails
          account={context.accountDetails}
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
            <Input
              name="stream-rate"
              type="text"
              value={`${amountPerSecond} ETH/sec`}
              disabled={true}
            />
          </Box>
        </Section>

        <Section>
          {renderRules({
            rules: [
              initialAmountRule,
              maxAmountRule,
              startTimeRule,
              expiryRule,
            ],
            context,
            metadata,
          })}
        </Section>
        {rulesToAddButton}
      </Box>
    </Box>
  );
}
