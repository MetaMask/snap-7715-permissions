import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Link, Section, Text } from '@metamask/snaps-sdk/jsx';

import {
  maxSwapAmountRule,
  tokenRestrictionRule,
  expiryRule,
} from './rules';
import type { NativeTokenSwapContext, NativeTokenSwapMetadata } from './types';
import { renderRules } from '../../core/rules';
import { t } from '../../utils/i18n';

const WHITELIST_LINK_PLACEHOLDER_HREF = 'https://example.com/whitelisted-tokens';

/**
 * Builds confirmation UI for a native token swap permission.
 * @param args.context - Permission context including swap cap and token policy.
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
          rules: [maxSwapAmountRule, tokenRestrictionRule],
          context,
          metadata,
        })}
        <Box direction="vertical">
          <Link href={WHITELIST_LINK_PLACEHOLDER_HREF}>
            {t('whitelistedTokensListLinkLabel')}
          </Link>
        </Box>
        {renderRules({
          rules: [expiryRule],
          context,
          metadata,
        })}
      </Section>
    </Box>
  );
}
