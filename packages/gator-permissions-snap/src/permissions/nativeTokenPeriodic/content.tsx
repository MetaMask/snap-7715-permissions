import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Section } from '@metamask/snaps-sdk/jsx';

import { getChainMetadata } from '../../core/chainMetadata';
import { JUSTIFICATION_SHOW_MORE_BUTTON_NAME } from '../../core/permissionHandler';
import { renderRules } from '../../core/rules';
import { AccountDetails } from '../../ui/components/AccountDetails';
import type { ItemDetails } from '../../ui/components/RequestDetails';
import { RequestDetails } from '../../ui/components/RequestDetails';
import {
  periodAmountRule,
  periodTypeRule,
  periodDurationRule,
  startTimeRule,
  expiryRule,
} from './rules';
import type {
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
} from './types';

/**
 * Creates UI content for a native token periodic permission confirmation.
 *
 * @param args - The configuration for the confirmation content.
 * @param args.context - The context containing permission details.
 * @param args.metadata - Metadata including derived values and validation errors.
 * @param args.isJustificationCollapsed - Whether the justification section is collapsed.
 * @param args.origin - The origin requesting the permission.
 * @param args.chainId - The chain ID for the permission.
 * @returns A Promise that resolves to the UI element for the confirmation dialog.
 */
export async function createConfirmationContent({
  context,
  metadata,
  isJustificationCollapsed,
  origin,
  chainId,
}: {
  context: NativeTokenPeriodicContext;
  metadata: NativeTokenPeriodicMetadata;
  isJustificationCollapsed: boolean;
  origin: string;
  chainId: number;
}): Promise<GenericSnapElement> {
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
      <Box direction="vertical">
        <RequestDetails
          itemDetails={itemDetails}
          justification={context.justification}
          isJustificationShowMoreCollapsed={isJustificationCollapsed}
          justificationShowMoreElementName={JUSTIFICATION_SHOW_MORE_BUTTON_NAME}
        />
        <AccountDetails
          account={context.accountDetails}
          tokenMetadata={context.tokenMetadata}
          title="Transfer from"
          tooltip="The account that the token transfers come from."
        />
        <Section>
          {renderRules({
            rules: [
              startTimeRule,
              periodAmountRule,
              periodTypeRule,
              periodDurationRule,
            ],
            context,
            metadata,
          })}
        </Section>

        <Section>
          {renderRules({
            rules: [expiryRule],
            context,
            metadata,
          })}
        </Section>
      </Box>
    </Box>
  );
}
