import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Divider, Section } from '@metamask/snaps-sdk/jsx';

import { allowanceAmountRule, startTimeRule, expiryRule } from './rules';
import type {
  NativeTokenAllowanceContext,
  NativeTokenAllowanceMetadata,
} from './types';
import { renderRules } from '../../core/rules';

/**
 * Creates UI content for a native token allowance permission confirmation.
 * @param args - The configuration for the confirmation content.
 * @param args.context - Context with allowance and schedule fields.
 * @param args.metadata - Validation state for rules.
 * @returns Confirmation section content.
 */
export async function createConfirmationContent({
  context,
  metadata,
}: {
  context: NativeTokenAllowanceContext;
  metadata: NativeTokenAllowanceMetadata;
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
