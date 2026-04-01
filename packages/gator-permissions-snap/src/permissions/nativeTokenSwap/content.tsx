import type { SnapElement } from '@metamask/snaps-sdk/jsx';
import { Box, Link, Section } from '@metamask/snaps-sdk/jsx';

import { allowanceRule, tokenRestrictionRule, expiryRule } from './rules';
import type { NativeTokenSwapContext, NativeTokenSwapMetadata } from './types';
import { renderRules } from '../../core/rules';
import { t } from '../../utils/i18n';

const WHITELIST_LINK_PLACEHOLDER_HREF =
  'https://example.com/whitelisted-tokens';

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
