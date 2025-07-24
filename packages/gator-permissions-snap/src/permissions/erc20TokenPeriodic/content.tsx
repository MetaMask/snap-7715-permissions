import type { GenericSnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Section } from '@metamask/snaps-sdk/jsx';

import { renderRules } from '../../core/rules';
import { AccountDetails } from '../../ui/components';
import {
  periodAmountRule,
  periodTypeRule,
  periodDurationRule,
  startTimeRule,
  expiryRule,
} from './rules';
import type {
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
} from './types';

/**
 * Creates UI content for an ERC20 token periodic permission confirmation.
 *
 * @param args - The configuration for the confirmation content.
 * @param args.context - The context containing permission details.
 * @param args.metadata - Metadata including derived values and validation errors.
 * @returns A Promise that resolves to the UI element for the confirmation dialog.
 */
export async function createConfirmationContent({
  context,
  metadata,
}: {
  context: Erc20TokenPeriodicContext;
  metadata: Erc20TokenPeriodicMetadata;
}): Promise<GenericSnapElement> {
  return (
    <Box>
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
  );
}
