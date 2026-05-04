import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Divider, Section } from '@metamask/snaps-sdk/jsx';

import { allowanceAmountRule, startTimeRule, expiryRule } from './rules';
import type {
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata,
} from './types';
import { renderRules } from '../../core/rules';

/**
 * Creates UI content for an ERC-20 token allowance permission confirmation.
 * @param args - The configuration for the confirmation content.
 * @param args.context - Context with allowance and schedule fields.
 * @param args.metadata - Validation state for rules.
 * @returns Confirmation section content.
 */
export async function createConfirmationContent({
  context,
  metadata,
}: {
  context: Erc20TokenAllowanceContext;
  metadata: Erc20TokenAllowanceMetadata;
}): Promise<SnapElement> {
  return (
    <Box>
      <Section>
        {renderRules({
          rules: [allowanceAmountRule],
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
    </Box>
  );
}
