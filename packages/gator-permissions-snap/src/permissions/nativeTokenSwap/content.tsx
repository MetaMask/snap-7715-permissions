import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Section } from '@metamask/snaps-sdk/jsx';

import { allowanceRule, tokenRestrictionRule, expiryRule } from './rules';
import type { NativeTokenSwapContext, NativeTokenSwapMetadata } from './types';
import { renderRules } from '../../core/rules';

/**
 * Builds confirmation UI for a native token swap permission.
 *
 * @param args - Dialog content inputs.
 * @param args.context - Permission context including allowance and token policy.
 * @param args.metadata - Validation metadata.
 * @returns Snap dialog content.
 */
export async function createConfirmationContent({
  context,
  metadata,
}: {
  context: NativeTokenSwapContext;
  metadata: NativeTokenSwapMetadata;
}): Promise<SnapElement> {
  return (
    <Box>
      <Section>
        {renderRules({
          rules: [allowanceRule, tokenRestrictionRule],
          context,
          metadata,
        })}
        {renderRules({
          rules: [expiryRule],
          context,
          metadata,
        })}
      </Section>
    </Box>
  );
}
