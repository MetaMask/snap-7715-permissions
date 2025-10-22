import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Section } from '@metamask/snaps-sdk/jsx';

import {
  periodAmountRule,
  periodDurationRule,
  startTimeRule,
  expiryRule,
} from './rules';
import type {
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
} from './types';
import { renderRules } from '../../core/rules';

/**
 * Creates UI content for an ERC20 token periodic permission confirmation.
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
}): Promise<SnapElement> {
  return (
    <Box>
      <Section>
        {renderRules({
          rules: [startTimeRule, periodAmountRule, periodDurationRule],
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
