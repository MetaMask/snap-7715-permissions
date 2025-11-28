import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Section } from '@metamask/snaps-sdk/jsx';

import { expiryRule } from './rules';
import type {
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata,
} from './types';
import { renderRules } from '../../core/rules';

/**
 * Creates UI content for an ERC20 token approval revocation permission.
 * Only expiry is configurable by the user; account selection is provided by the wrapper.
 */
export async function createConfirmationContent({
  context,
  metadata,
}: {
  context: Erc20TokenRevocationContext;
  metadata: Erc20TokenRevocationMetadata;
}): Promise<SnapElement> {
  return (
    <Box>
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


