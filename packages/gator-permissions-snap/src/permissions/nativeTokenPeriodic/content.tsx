import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Divider, Section } from '@metamask/snaps-sdk/jsx';

import {
  periodAmountRule,
  periodDurationRule,
  startTimeRule,
  expiryRule,
} from './rules';
import type {
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
} from './types';
import { renderRules } from '../../core/rules';

/**
 * Creates UI content for a native token periodic permission confirmation.
 * @param args - The configuration for the confirmation content.
 * @param args.context - The context containing permission details.
 * @param args.metadata - Metadata including derived values and validation errors.
 * @returns A Promise that resolves to the UI element for the confirmation dialog.
 */
export async function createConfirmationContent({
  context,
  metadata,
}: {
  context: NativeTokenPeriodicContext;
  metadata: NativeTokenPeriodicMetadata;
}): Promise<SnapElement> {
  return (
    <Box>
      <Section>
        {renderRules({
          rules: [periodAmountRule, periodDurationRule],
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
